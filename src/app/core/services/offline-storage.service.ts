import { Injectable, inject } from '@angular/core';
import { StorageService } from 'src/app/modules/auth/services/storage.service';
import { SyncEntity, SyncStatus, OfflineData, SyncOperation, SyncQueue } from 'src/app/shared/models/sync.model';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly STORAGE_KEYS = {
    EXPENSES: 'offline_expenses',
    CATEGORIES: 'offline_categories',
    USER: 'offline_user',
    SYNC_QUEUE: 'sync_queue',
    SYNC_METADATA: 'sync_metadata',
    LAST_BACKUP: 'last_backup'
  };

  private syncQueueSubject = new BehaviorSubject<SyncQueue>({
    operations: [],
    isProcessing: false,
    lastProcessed: new Date(),
    totalProcessed: 0,
    totalErrors: 0
  });

  public syncQueue$ = this.syncQueueSubject.asObservable();

  private storageService = inject(StorageService);

  constructor() {
    this.loadSyncQueue();
  }

  // ==================== ENTITY MANAGEMENT ====================

  saveEntity<T extends SyncEntity>(entityType: string, entity: T): Observable<T> {
    return from(this.getEntities<T>(entityType)).pipe(
      map(entities => {
        const existingIndex = entities.findIndex(e => e._id === entity._id);
        
        if (existingIndex >= 0) {
          entities[existingIndex] = {
            ...entity,
            _lastModified: new Date(),
            _version: (entities[existingIndex]._version || 0) + 1
          };
        } else {
          entities.push({
            ...entity,
            _lastModified: new Date(),
            _version: 1,
            _syncStatus: SyncStatus.PENDING
          });
        }

        this.setEntities(entityType, entities);
        this.addToSyncQueue('UPDATE', entityType, entity._id, entity);
        
        return entity;
      }),
      catchError(error => {
        console.error(`Error saving ${entityType}:`, error);
        return of(entity);
      })
    );
  }

  getEntity<T extends SyncEntity>(entityType: string, id: string): Observable<T | null> {
    return from(this.getEntities<T>(entityType)).pipe(
      map(entities => entities.find(e => e._id === id) || null)
    );
  }

  getEntities<T extends SyncEntity>(entityType: string): Observable<T[]> {
    return from(this.getEntitiesSync<T>(entityType)).pipe(
      map(entities => entities.filter(e => !e._isDeleted)) // Filter out deleted items
    );
  }

  /**
   * Get all entities including deleted ones (for backup purposes)
   */
  getAllEntitiesForBackup<T extends SyncEntity>(entityType: string): Observable<T[]> {
    return from(this.getEntitiesSync<T>(entityType));
  }

  /**
   * Replace all entities of a specific type (used during sync pull)
   */
  replaceEntities<T extends SyncEntity>(entityType: string, entities: T[]): Observable<boolean> {
    return from(this.setEntities(entityType, entities)).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Error replacing ${entityType} entities:`, error);
        return of(false);
      })
    );
  }

  /**
   * Merge entities from server with local entities
   */
  mergeEntities<T extends SyncEntity>(entityType: string, serverEntities: T[]): Observable<boolean> {
    return this.getEntities<T>(entityType).pipe(
      switchMap((localEntities: T[]) => {
        const merged = [...localEntities];
        
        serverEntities.forEach(serverEntity => {
          const localIndex = merged.findIndex(e => e._id === serverEntity._id);
          
          // Handle deleted items from server
          if (serverEntity._isDeleted) {
            if (localIndex >= 0) {
              // Remove deleted item from local storage
              merged.splice(localIndex, 1);
            }
            // If not found locally, ignore (already deleted)
            return;
          }
          
          if (localIndex >= 0) {
            // Update existing entity if server version is newer
            const localEntity = merged[localIndex];
            const serverTime = new Date(serverEntity._lastModified).getTime();
            const localTime = new Date(localEntity._lastModified).getTime();
            
            if (serverTime >= localTime) {
              merged[localIndex] = { ...serverEntity, _syncStatus: SyncStatus.SYNCED };
            }
          } else {
            // Add new entity from server
            merged.push({ ...serverEntity, _syncStatus: SyncStatus.SYNCED });
          }
        });
        
        return from(this.setEntities(entityType, merged)).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      })
    );
  }

  private async getEntitiesSync<T extends SyncEntity>(entityType: string): Promise<T[]> {
    try {
      const key = this.getStorageKey(entityType);
      const data = this.storageService.get<T[]>(key);
      return data || [];
    } catch (error) {
      console.error(`Error getting ${entityType} entities:`, error);
      return [];
    }
  }

  deleteEntity(entityType: string, id: string): Observable<boolean> {
    return from(this.getEntitiesSync(entityType)).pipe(
      map(entities => {
        const entity = entities.find(e => e._id === id);
        if (entity) {
          entity._isDeleted = true;
          entity._lastModified = new Date();
          entity._syncStatus = SyncStatus.PENDING;
          this.setEntities(entityType, entities);
          this.addToSyncQueue('DELETE', entityType, id, entity);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error(`Error deleting ${entityType}:`, error);
        return of(false);
      })
    );
  }

  // ==================== SYNC QUEUE MANAGEMENT ====================

  addToSyncQueue(type: 'CREATE' | 'UPDATE' | 'DELETE', entityType: string, entityId: string, data: any): void {
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

    const currentQueue = this.syncQueueSubject.value;
    const updatedQueue = {
      ...currentQueue,
      operations: [...currentQueue.operations, operation]
    };

    this.syncQueueSubject.next(updatedQueue);
    this.saveSyncQueue(updatedQueue);
  }

  removeFromSyncQueue(operationId: string): void {
    const currentQueue = this.syncQueueSubject.value;
    const updatedQueue = {
      ...currentQueue,
      operations: currentQueue.operations.filter(op => op.id !== operationId)
    };

    this.syncQueueSubject.next(updatedQueue);
    this.saveSyncQueue(updatedQueue);
  }

  updateSyncOperation(operationId: string, updates: Partial<SyncOperation>): void {
    const currentQueue = this.syncQueueSubject.value;
    const updatedQueue = {
      ...currentQueue,
      operations: currentQueue.operations.map(op => 
        op.id === operationId ? { ...op, ...updates } : op
      )
    };

    this.syncQueueSubject.next(updatedQueue);
    this.saveSyncQueue(updatedQueue);
  }

  getPendingOperations(): Observable<SyncOperation[]> {
    return this.syncQueue$.pipe(
      map(queue => queue.operations.filter(op => op.status === SyncStatus.PENDING))
    );
  }

  // ==================== BACKUP & RESTORE ====================

  createBackup(): Observable<OfflineData> {
    return from(Promise.all([
      this.getEntitiesSync('expense'),
      this.getEntitiesSync('category'),
      this.getEntitiesSync('user')
    ])).pipe(
      map(([expenses, categories, user]) => {
        const backup: OfflineData = {
          expenses,
          categories,
          user: user[0] || null,
          lastBackup: new Date(),
          version: '1.0.0'
        };

        this.storageService.set(this.STORAGE_KEYS.LAST_BACKUP, backup);
        return backup;
      }),
      catchError(error => {
        console.error('Error creating backup:', error);
        return of(null as any);
      })
    );
  }

  restoreBackup(backup: OfflineData): Observable<boolean> {
    return from(Promise.all([
      this.setEntities('expense', backup.expenses),
      this.setEntities('category', backup.categories),
      backup.user ? this.setEntities('user', [backup.user]) : Promise.resolve()
    ])).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error restoring backup:', error);
        return of(false);
      })
    );
  }

  // ==================== UTILITY METHODS ====================

  private getStorageKey(entityType: string): string {
    const keyMap: { [key: string]: string } = {
      'expense': this.STORAGE_KEYS.EXPENSES,
      'category': this.STORAGE_KEYS.CATEGORIES,
      'user': this.STORAGE_KEYS.USER
    };
    return keyMap[entityType] || `offline_${entityType}`;
  }

  /**
   * Set all entities of a specific type (public for backup/restore)
   */
  setEntities<T>(entityType: string, entities: T[]): Promise<void> {
    return new Promise((resolve) => {
      try {
        const key = this.getStorageKey(entityType);
        this.storageService.set(key, entities);
        resolve();
      } catch (error) {
        console.error(`Error setting ${entityType} entities:`, error);
        resolve(); // Resolve anyway to prevent blocking
      }
    });
  }

  private loadSyncQueue(): void {
    try {
      const queue = this.storageService.get<SyncQueue>(this.STORAGE_KEYS.SYNC_QUEUE);
      if (queue) {
        // Convert date strings back to Date objects
        queue.operations = queue.operations.map(op => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
        queue.lastProcessed = new Date(queue.lastProcessed);
        this.syncQueueSubject.next(queue);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  private saveSyncQueue(queue: SyncQueue): void {
    try {
      this.storageService.set(this.STORAGE_KEYS.SYNC_QUEUE, queue);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ==================== CLEANUP ====================

  clearOfflineData(): Observable<boolean> {
    return from(Promise.all([
      this.storageService.remove(this.STORAGE_KEYS.EXPENSES),
      this.storageService.remove(this.STORAGE_KEYS.CATEGORIES),
      this.storageService.remove(this.STORAGE_KEYS.USER),
      this.storageService.remove(this.STORAGE_KEYS.SYNC_QUEUE),
      this.storageService.remove(this.STORAGE_KEYS.SYNC_METADATA)
    ])).pipe(
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
    return from(Promise.resolve()).pipe(
      map(() => {
        let totalSize = 0;
        Object.values(this.STORAGE_KEYS).forEach(key => {
          const data = this.storageService.get(key);
          if (data) {
            totalSize += JSON.stringify(data).length;
          }
        });
        return totalSize;
      })
    );
  }
}
