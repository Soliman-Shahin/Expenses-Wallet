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
    syncInterval: 300000, // 5 minutes (300000ms) - optimized for battery and data usage
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

  // ==================== SYNC API ENDPOINTS ====================

  /**
   * Pull data from server sync API
   */
  pullFromServer(params: {
    lastSyncTime?: string;
    entityType?: 'expense' | 'category' | 'user';
    limit?: number;
    offset?: number;
  } = {}): Observable<any> {
    return this.apiService.get<any>(
      `/sync/pull`,
      this.buildHttpParams(params)
    );
  }

  /**
   * Push local changes to server sync API
   */
  pushToServer(entities: any[]): Observable<any> {
    return this.apiService.post<any>(`/sync/push`, { entities });
  }

  /**
   * Bulk sync to server
   */
  bulkSyncToServer(entities: any[]): Observable<any> {
    return this.apiService.post<any>(`/sync/bulk`, { entities });
  }

  /**
   * Get conflicts from server
   */
  getConflictsFromServer(): Observable<any[]> {
    return this.apiService.get<any[]>(`/sync/conflicts`);
  }

  /**
   * Resolve conflict on server
   */
  resolveConflictOnServer(conflict: {
    entityId: string;
    entityType: string;
    resolution: 'local' | 'server' | 'merge';
    mergedData?: any;
  }): Observable<any> {
    return this.apiService.post<any>(`/sync/conflicts/resolve`, conflict);
  }

  /**
   * Get sync metadata from server
   */
  getSyncMetadataFromServer(): Observable<any> {
    return this.apiService.get<any>(`/sync/metadata`);
  }

  /**
   * Update sync metadata on server
   */
  updateSyncMetadataOnServer(metadata: any): Observable<any> {
    return this.apiService.put<any>(`/sync/metadata`, metadata);
  }

  /**
   * Helper to build HttpParams from object
   */
  private buildHttpParams(params: any): any {
    // Angular HttpParams is not imported here, so just return params as is for ApiService
    return params;
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

  /**
   * مزامنة كل شيء: Pull ثم Push (Best Practice)
   */
  syncAll(): Observable<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return of(false);
    }

    if (!this.isOnline) {
      console.log('Device is offline, skipping sync...');
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

    console.log('Starting full sync...');

    // 1. Pull latest data from server
    return this.pullFromServer({
      lastSyncTime: this.syncMetadataSubject.value.lastSyncTime?.toISOString?.() || undefined
    }).pipe(
      switchMap((pullResult: any) => {
        console.log('Pull result:', pullResult);
        
        // تحديث الداتا المحلية بناءً على رد السيرفر
        if (pullResult?.entities && Array.isArray(pullResult.entities)) {
          // دمج كل نوع من الـ entities
          const expenseEntities = pullResult.entities.filter((e: any) => e._entityType === 'expense');
          const categoryEntities = pullResult.entities.filter((e: any) => e._entityType === 'category');
          
          if (expenseEntities.length > 0) {
            this.offlineStorage.mergeEntities('expense', expenseEntities).subscribe();
          }
          if (categoryEntities.length > 0) {
            this.offlineStorage.mergeEntities('category', categoryEntities).subscribe();
          }
        }
        
        if (pullResult?.conflicts && Array.isArray(pullResult.conflicts)) {
          this.updateSyncMetadata({ conflictCount: pullResult.conflicts.length });
        }
        
        // 2. Push local pending operations to server
        return this.offlineStorage.getPendingOperations().pipe(
          switchMap(operations => {
            console.log('Pending operations:', operations.length);
            
            if (!operations.length) {
              this.completeSync();
              return of(true);
            }
            
            // تحويل العمليات لصيغة مناسبة للسيرفر
            const entitiesToPush = operations.map(op => ({
              _id: op.entityId,
              _entityType: op.entityType,
              _lastModified: op.timestamp,
              _version: 1,
              _isDeleted: op.type === 'DELETE',
              ...op.data
            }));
            
            // دفع كل العمليات دفعة واحدة
            return this.pushToServer(entitiesToPush).pipe(
              tap((pushResult: any) => {
                console.log('Push result:', pushResult);
                
                // إذا فيه تعارضات أو أخطاء
                if (pushResult?.conflicts?.length) {
                  this.updateSyncMetadata({ conflictCount: pushResult.conflicts.length });
                }
                
                // إزالة العمليات من الـ queue إذا نجحت
                if (pushResult?.success) {
                  operations.forEach(op => this.offlineStorage.removeFromSyncQueue(op.id));
                }
              }),
              map((pushResult: any) => !!pushResult?.success),
              catchError(error => {
                console.error('Sync push error:', error);
                this.updateSyncProgress({ errors: [error.message || 'Sync push error'] });
                return of(false);
              })
            );
          })
        );
      }),
      tap(() => this.completeSync()),
      catchError(error => {
        console.error('Sync error:', error);
        this.updateSyncProgress({ errors: [error.message || 'Unknown sync error'] });
        this.completeSync();
        return of(false);
      }),
      finalize(() => {
        this.syncInProgress = false;
        this.updateSyncMetadata({ isSyncing: false });
        console.log('Sync completed');
      })
    );
  }

  /**
   * مزامنة مجموعة عمليات دفعة واحدة (Bulk)
   */
  private syncOperations(operations: SyncOperation[]): Observable<boolean> {
    if (!operations.length) return of(true);
    return this.bulkSyncToServer(operations).pipe(
      tap((result: any) => {
        if (result?.success) {
          operations.forEach(op => this.offlineStorage.removeFromSyncQueue(op.id));
        }
        if (result?.results) {
          const conflicts = result.results.filter((r: any) => r.conflict);
          if (conflicts.length) {
            this.updateSyncMetadata({ conflictCount: conflicts.length });
          }
        }
      }),
      map((result: any) => !!result?.success),
      catchError(error => {
        this.updateSyncProgress({ errors: [error.message || 'Bulk sync error'] });
        return of(false);
      })
    );
  }

  /**
   * مزامنة عملية واحدة (تستخدم فقط في حالات خاصة)
   */
  private syncOperation(operation: SyncOperation): Observable<boolean> {
    // هنا يمكن استخدام pushToServer لعملية واحدة أو bulkSyncToServer لمجموعة
    return this.pushToServer([operation]).pipe(
      tap((result: any) => {
        if (result?.success) {
          this.offlineStorage.removeFromSyncQueue(operation.id);
        }
        if (result?.conflicts?.length) {
          this.updateSyncMetadata({ conflictCount: result.conflicts.length });
        }
      }),
      map((result: any) => !!result?.success),
      catchError(error => {
        this.updateSyncProgress({ errors: [error.message || 'Sync operation error'] });
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
    const now = new Date();
    this.updateSyncMetadata({
      lastSyncTime: now,
      isSyncing: false
    });

    this.updateSyncProgress({
      isComplete: true,
      currentOperation: 'Sync completed',
      percentage: 100
    });
    
    console.log('Sync metadata updated:', this.syncMetadataSubject.value);
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
