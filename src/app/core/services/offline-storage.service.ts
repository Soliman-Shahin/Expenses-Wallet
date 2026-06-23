import { Injectable, inject } from '@angular/core';
import { SyncEntity, SyncStatus, OfflineData, SyncOperation, SyncQueue } from 'src/app/shared/models/sync.model';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map, catchError, tap, take } from 'rxjs/operators';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db = inject(DatabaseService);

  private syncQueueSubject = new BehaviorSubject<SyncQueue>({
    operations: [],
    isProcessing: false,
    lastProcessed: new Date(),
    totalProcessed: 0,
    totalErrors: 0
  });

  public syncQueue$ = this.syncQueueSubject.asObservable();

  constructor() {
    this.loadSyncQueue();
  }

  // ==================== ENTITY MANAGEMENT ====================

  saveEntity<T extends SyncEntity>(entityType: string, entity: T): Observable<T> {
    return from(this.saveEntityAsync(entityType, entity)).pipe(
      catchError(error => {
        console.error(`Error saving ${entityType}:`, error);
        return of(entity);
      })
    );
  }

  private async saveEntityAsync<T extends SyncEntity>(entityType: string, entity: T): Promise<T> {
    const table = this.db.getTable(entityType);
    const existing = await table.get(entity._id);

    let updatedEntity: T;
    if (existing) {
      updatedEntity = {
        ...entity,
        _lastModified: new Date(),
        _version: (existing._version || 0) + 1
      };
    } else {
      updatedEntity = {
        ...entity,
        _lastModified: new Date(),
        _version: 1,
        _syncStatus: SyncStatus.PENDING
      };
    }

    await table.put(updatedEntity);
    await this.addToSyncQueueAsync('UPDATE', entityType, entity._id, updatedEntity);
    return updatedEntity;
  }

  getEntity<T extends SyncEntity>(entityType: string, id: string): Observable<T | null> {
    return from(this.db.getTable(entityType).get(id)).pipe(
      map(res => (res as T) || null)
    );
  }

  getEntities<T extends SyncEntity>(entityType: string): Observable<T[]> {
    return from(this.db.getTable(entityType).filter((e: any) => !e._isDeleted).toArray()).pipe(
      map(res => res as T[])
    );
  }

  getAllEntitiesForBackup<T extends SyncEntity>(entityType: string): Observable<T[]> {
    return from(this.db.getTable(entityType).toArray()).pipe(
      map(res => res as T[])
    );
  }

  replaceEntities<T extends SyncEntity>(entityType: string, entities: T[]): Observable<boolean> {
    return from(this.db.getTable(entityType).bulkPut(entities)).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Error replacing ${entityType} entities:`, error);
        return of(false);
      })
    );
  }

  mergeEntities<T extends SyncEntity>(entityType: string, serverEntities: T[]): Observable<boolean> {
    return from(this.mergeEntitiesAsync(entityType, serverEntities)).pipe(
      catchError(error => {
        console.error(`Error merging ${entityType} entities:`, error);
        return of(false);
      })
    );
  }

  private async mergeEntitiesAsync<T extends SyncEntity>(entityType: string, serverEntities: T[]): Promise<boolean> {
    const table = this.db.getTable(entityType);
    const localEntities = await table.toArray();
    
    for (const serverEntity of serverEntities) {
      const localEntity = localEntities.find((e: any) => e._id === serverEntity._id);

      if (serverEntity._isDeleted) {
        if (localEntity) {
          await table.delete(localEntity._id);
        }
        continue;
      }

      if (localEntity) {
        const serverTime = new Date(serverEntity._lastModified).getTime();
        const localTime = new Date(localEntity._lastModified).getTime();

        if (serverTime >= localTime) {
          await table.put({ ...serverEntity, _syncStatus: SyncStatus.SYNCED });
        }
      } else {
        await table.put({ ...serverEntity, _syncStatus: SyncStatus.SYNCED });
      }
    }
    return true;
  }

  deleteEntity(entityType: string, id: string): Observable<boolean> {
    return from(this.deleteEntityAsync(entityType, id)).pipe(
      catchError(error => {
        console.error(`Error deleting ${entityType}:`, error);
        return of(false);
      })
    );
  }

  private async deleteEntityAsync(entityType: string, id: string): Promise<boolean> {
    const table = this.db.getTable(entityType);
    const entity = await table.get(id);

    if (entity) {
      entity._isDeleted = true;
      entity._lastModified = new Date();
      entity._syncStatus = SyncStatus.PENDING;
      await table.put(entity);
      await this.addToSyncQueueAsync('DELETE', entityType, id, entity);
      return true;
    }
    return false;
  }

  removeEntityHard(entityType: string, id: string): void {
    this.db.getTable(entityType).delete(id).catch(console.error);
  }

  // ==================== SYNC QUEUE MANAGEMENT ====================

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  addToSyncQueue(type: 'CREATE' | 'UPDATE' | 'DELETE', entityType: string, entityId: string, data: any): void {
    this.addToSyncQueueAsync(type, entityType, entityId, data).catch(console.error);
  }

  private async addToSyncQueueAsync(type: 'CREATE' | 'UPDATE' | 'DELETE', entityType: string, entityId: string, data: any): Promise<void> {
    const operation: SyncOperation = {
      id: this.generateId(),
      type,
      entityType: entityType as any,
      entityId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      status: SyncStatus.PENDING
    };

    await this.db.syncOperations.put(operation);
    await this.loadSyncQueue();
  }

  removeFromSyncQueue(operationId: string): void {
    this.db.syncOperations.delete(operationId).then(() => this.loadSyncQueue()).catch(console.error);
  }

  updateSyncOperation(operationId: string, updates: Partial<SyncOperation>): void {
    this.db.syncOperations.update(operationId, updates).then(() => this.loadSyncQueue()).catch(console.error);
  }

  getPendingOperations(): Observable<SyncOperation[]> {
    return this.syncQueue$.pipe(
      take(1),
      map(queue => queue.operations.filter(op => op.status === SyncStatus.PENDING))
    );
  }

  private async loadSyncQueue() {
    try {
      const ops = await this.db.syncOperations.toArray();
      const currentQueue = this.syncQueueSubject.value;
      this.syncQueueSubject.next({
        ...currentQueue,
        operations: ops
      });
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  // ==================== BACKUP & RESTORE ====================

  createBackup(): Observable<OfflineData> {
    return from(Promise.all([
      this.db.expenses.toArray(),
      this.db.categories.toArray(),
      this.db.users.toArray()
    ])).pipe(
      map(([expenses, categories, users]) => {
        return {
          expenses,
          categories,
          user: users[0] || null,
          lastBackup: new Date(),
          version: '1.0.0'
        };
      })
    );
  }

  restoreBackup(backup: OfflineData): Observable<boolean> {
    return from(Promise.all([
      this.db.expenses.clear().then(() => this.db.expenses.bulkPut(backup.expenses)),
      this.db.categories.clear().then(() => this.db.categories.bulkPut(backup.categories)),
      this.db.users.clear().then(() => backup.user ? this.db.users.put(backup.user).then(() => {}) : Promise.resolve())
    ])).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error restoring backup:', error);
        return of(false);
      })
    );
  }

  // ==================== CLEANUP ====================

  clearOfflineData(): Observable<boolean> {
    return from(Promise.all([
      this.db.expenses.clear(),
      this.db.categories.clear(),
      this.db.users.clear(),
      this.db.syncOperations.clear()
    ])).pipe(
      tap(() => this.loadSyncQueue()),
      map(() => {
        this.syncQueueSubject.next({
          operations: [],
          isProcessing: false,
          lastProcessed: new Date(),
          totalProcessed: 0,
          totalErrors: 0
        });
        return true;
      }),
      catchError(error => {
        console.error('Error clearing offline data:', error);
        return of(false);
      })
    );
  }

  getStorageSize(): Observable<number> {
    return from(Promise.all([
      this.db.expenses.count(),
      this.db.categories.count(),
      this.db.syncOperations.count()
    ])).pipe(
      map(([expenses, categories, ops]) => expenses + categories + ops)
    );
  }
}
