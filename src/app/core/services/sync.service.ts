import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, from, of, timer, interval, merge } from 'rxjs';
import { 
  map, 
  switchMap, 
  catchError, 
  tap, 
  filter, 
  takeUntil, 
  retry, 
  delay,
  concatMap,
  mergeMap,
  finalize,
  take
} from 'rxjs/operators';
import { Network } from '@capacitor/network';
import { ApiService } from './api.service';
import { OfflineStorageService } from './offline-storage.service';
import { 
  SyncEntity, 
  SyncStatus, 
  SyncMetadata, 
  SyncOperation, 
  SyncConfig, 
  SyncProgress,
  ConflictResolution 
} from 'src/app/shared/models/sync.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiService = inject(ApiService);
  private offlineStorage = inject(OfflineStorageService);

  private syncConfig: SyncConfig = {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    maxRetries: 3,
    conflictResolution: 'prompt',
    batchSize: 10,
    enableOfflineMode: true
  };

  private syncMetadataSubject = new BehaviorSubject<SyncMetadata>({
    lastSyncTime: new Date(),
    totalEntities: 0,
    pendingCount: 0,
    conflictCount: 0,
    errorCount: 0,
    isOnline: false,
    isSyncing: false
  });

  private syncProgressSubject = new BehaviorSubject<SyncProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    currentOperation: '',
    isComplete: true,
    errors: []
  });

  public syncMetadata$ = this.syncMetadataSubject.asObservable();
  public syncProgress$ = this.syncProgressSubject.asObservable();

  private isOnline = false;
  private syncInProgress = false;

  constructor() {
    this.initializeNetworkMonitoring();
    this.initializeAutoSync();
  }

  // ==================== INITIALIZATION ====================

  private initializeNetworkMonitoring(): void {
    // Check initial network status
    Network.getStatus().then((status: any) => {
      this.isOnline = status.connected;
      this.updateSyncMetadata({ isOnline: this.isOnline });
    });

    // Listen for network changes
    Network.addListener('networkStatusChange', (status: any) => {
      this.isOnline = status.connected;
      this.updateSyncMetadata({ isOnline: this.isOnline });
      
      if (this.isOnline && this.syncConfig.autoSync) {
        this.syncAll();
      }
    });
  }

  private initializeAutoSync(): void {
    if (this.syncConfig.autoSync) {
      interval(this.syncConfig.syncInterval).pipe(
        filter(() => this.isOnline && !this.syncInProgress),
        switchMap(() => this.syncAll())
      ).subscribe();
    }
  }

  // ==================== MAIN SYNC METHODS ====================

  syncAll(): Observable<boolean> {
    if (this.syncInProgress) {
      return of(false);
    }

    this.syncInProgress = true;
    this.updateSyncMetadata({ isSyncing: true });
    this.updateSyncProgress({ 
      current: 0, 
      total: 0, 
      percentage: 0, 
      currentOperation: 'Starting sync...',
      isComplete: false,
      errors: []
    });

    return this.offlineStorage.getPendingOperations().pipe(
      switchMap(operations => {
        if (operations.length === 0) {
          this.completeSync();
          return of(true);
        }

        this.updateSyncProgress({ 
          total: operations.length,
          currentOperation: `Syncing ${operations.length} operations...`
        });

        return this.syncOperations(operations);
      }),
      tap(() => this.completeSync()),
      catchError(error => {
        console.error('Sync error:', error);
        this.updateSyncProgress({
          errors: [error.message || 'Unknown sync error']
        });
        this.completeSync();
        return of(false);
      }),
      finalize(() => {
        this.syncInProgress = false;
        this.updateSyncMetadata({ isSyncing: false });
      })
    );
  }

  private syncOperations(operations: SyncOperation[]): Observable<boolean> {
    return from(operations).pipe(
      concatMap(operation => this.syncOperation(operation)),
      map(() => true),
      catchError(error => {
        console.error('Operation sync error:', error);
        return of(false);
      })
    );
  }

  private syncOperation(operation: SyncOperation): Observable<boolean> {
    this.updateSyncProgress({
      currentOperation: `${operation.type} ${operation.entityType}`
    });

    const syncMethod = this.getSyncMethod(operation.type);
    return syncMethod(operation).pipe(
      tap(() => {
        this.offlineStorage.removeFromSyncQueue(operation.id);
        // Use syncMetadata$ observable to get the latest value and update accordingly
        this.syncMetadata$.pipe(take(1)).subscribe(currentMeta => {
          this.updateSyncMetadata({
            pendingCount: (currentMeta?.pendingCount ?? 1) - 1
          });
        });
      }),
      catchError(error => {
        this.handleSyncError(operation, error);
        return of(false);
      })
    );
  }

  // ==================== SYNC METHODS BY OPERATION TYPE ====================

  private getSyncMethod(type: string) {
    const methods = {
      'CREATE': (op: SyncOperation) => this.createEntity(op),
      'UPDATE': (op: SyncOperation) => this.updateEntity(op),
      'DELETE': (op: SyncOperation) => this.deleteEntity(op)
    };
    return methods[type as keyof typeof methods] || (() => of(false));
  }

  private createEntity(operation: SyncOperation): Observable<boolean> {
    const endpoint = this.getEndpoint(operation.entityType);
    return this.apiService.post(`${endpoint}`, operation.data).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Create ${operation.entityType} error:`, error);
        return of(false);
      })
    );
  }

  private updateEntity(operation: SyncOperation): Observable<boolean> {
    const endpoint = this.getEndpoint(operation.entityType);
    return this.apiService.put(`${endpoint}/${operation.entityId}`, operation.data).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Update ${operation.entityType} error:`, error);
        return of(false);
      })
    );
  }

  private deleteEntity(operation: SyncOperation): Observable<boolean> {
    const endpoint = this.getEndpoint(operation.entityType);
    return this.apiService.delete(`${endpoint}/${operation.entityId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Delete ${operation.entityType} error:`, error);
        return of(false);
      })
    );
  }

  // ==================== CONFLICT RESOLUTION ====================

  resolveConflict(resolution: ConflictResolution): Observable<boolean> {
    const { entityId, entityType, resolution: resolutionType, mergedData } = resolution;

    let dataToSync = mergedData;
    if (resolutionType === 'local') {
      dataToSync = resolution.localData;
    } else if (resolutionType === 'server') {
      dataToSync = resolution.serverData;
    }

    return this.apiService.put(`/${entityType}/${entityId}`, dataToSync).pipe(
      tap(() => {
        const currentMetadata = (this.syncMetadata$ as BehaviorSubject<SyncMetadata>).getValue();
        this.updateSyncMetadata({
          conflictCount: (currentMetadata?.conflictCount ?? 1) - 1
        });
      }),
      map(() => true),
      catchError(error => {
        console.error('Conflict resolution error:', error);
        return of(false);
      })
    );
  }

  // ==================== PULL DATA FROM SERVER ====================

  pullData(entityType: string): Observable<any[]> {
    const endpoint = this.getEndpoint(entityType);
    return this.apiService.get<any[]>(`/${endpoint}`).pipe(
      tap(data => {
        // Update local storage with server data
        this.offlineStorage.getEntities(entityType).pipe(
          switchMap(localEntities => {
            const updatedEntities = this.mergeServerData(localEntities, data);
            return this.offlineStorage.getEntities(entityType);
          })
        ).subscribe();
      }),
      catchError(error => {
        console.error(`Pull ${entityType} error:`, error);
        return of([]);
      })
    );
  }

  private mergeServerData(localEntities: SyncEntity[], serverData: any[]): SyncEntity[] {
    const merged = [...localEntities];
    
    serverData.forEach(serverEntity => {
      const localIndex = merged.findIndex(e => e._id === serverEntity._id);
      
      if (localIndex >= 0) {
        // Check for conflicts
        const localEntity = merged[localIndex];
        if (this.hasConflict(localEntity, serverEntity)) {
          localEntity._syncStatus = SyncStatus.CONFLICT;
          localEntity._conflictData = serverEntity;
        } else {
          merged[localIndex] = { ...serverEntity, _syncStatus: SyncStatus.SYNCED };
        }
      } else {
        // New entity from server
        merged.push({ ...serverEntity, _syncStatus: SyncStatus.SYNCED });
      }
    });

    return merged;
  }

  private hasConflict(localEntity: SyncEntity, serverEntity: any): boolean {
    return localEntity._lastModified > new Date(serverEntity.updatedAt) && 
           localEntity._syncStatus === SyncStatus.PENDING;
  }

  // ==================== UTILITY METHODS ====================

  private getEndpoint(entityType: string): string {
    const endpoints = {
      'expense': 'expenses',
      'category': 'categories',
      'user': 'user'
    };
    return endpoints[entityType as keyof typeof endpoints] || entityType;
  }

  private handleSyncError(operation: SyncOperation, error: any): void {
    const retryCount = operation.retryCount + 1;
    
    if (retryCount < operation.maxRetries) {
      this.offlineStorage.updateSyncOperation(operation.id, {
        retryCount,
        status: SyncStatus.PENDING
      });
      
      // Retry after delay
      timer(5000).pipe(
        switchMap(() => this.syncOperation(operation))
      ).subscribe();
    } else {
      this.offlineStorage.updateSyncOperation(operation.id, {
        status: SyncStatus.ERROR,
        error: error.message || 'Max retries exceeded'
      });

      this.updateSyncMetadata({
        errorCount: this.syncMetadataSubject.value.errorCount + 1
      });
    }
  }

  private completeSync(): void {
    this.updateSyncMetadata({
      ...this.syncMetadataSubject.value,
      lastSyncTime: new Date(),
      isSyncing: false
    });

    this.updateSyncProgress({
      isComplete: true,
      currentOperation: 'Sync completed'
    });
  }

  private updateSyncMetadata(updates: Partial<SyncMetadata>): void {
    this.syncMetadataSubject.next({
      ...this.syncMetadataSubject.value,
      ...updates
    });
  }

  private updateSyncProgress(updates: Partial<SyncProgress>): void {
    this.syncProgressSubject.next({
      ...this.syncProgressSubject.value,
      ...updates
    });
  }

  // ==================== CONFIGURATION ====================

  updateConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
  }

  getConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  // ==================== MANUAL SYNC TRIGGERS ====================

  forceSync(): Observable<boolean> {
    return this.syncAll();
  }

  syncEntity(entityType: string, entityId: string): Observable<boolean> {
    return this.offlineStorage.getEntity(entityType, entityId).pipe(
      switchMap(entity => {
        if (entity) {
          return this.syncOperation({
            id: this.generateId(),
            type: 'UPDATE',
            entityType: entityType as any,
            entityId,
            data: entity,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3,
            status: SyncStatus.PENDING
          });
        }
        return of(false);
      })
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ==================== STATUS QUERIES ====================

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  getPendingCount(): Observable<number> {
    return this.syncMetadata$.pipe(
      map(metadata => metadata.pendingCount)
    );
  }

  getConflictCount(): Observable<number> {
    return this.syncMetadata$.pipe(
      map(metadata => metadata.conflictCount)
    );
  }
}
