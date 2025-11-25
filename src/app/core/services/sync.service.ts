import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, from, of, timer, interval } from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  tap,
  filter,
  finalize,
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
} from 'src/app/shared/models/sync.model';

/**
 * 🔄 Sync Service - Professional Implementation
 *
 * المسؤوليات:
 * 1. مزامنة البيانات بين الفرونت والباك (Pull & Push)
 * 2. إدارة الـ Offline Mode
 * 3. معالجة التعارضات (Conflicts)
 * 4. تتبع حالة المزامنة (Metadata & Progress)
 */
@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private apiService = inject(ApiService);
  private offlineStorage = inject(OfflineStorageService);

  // ==================== CONFIGURATION ====================

  private syncConfig: SyncConfig = {
    autoSync: true,
    syncInterval: 300000, // 5 minutes
    maxRetries: 3,
    conflictResolution: 'prompt',
    batchSize: 50,
    enableOfflineMode: true,
  };

  // ==================== OBSERVABLES ====================

  private syncMetadataSubject = new BehaviorSubject<SyncMetadata>({
    lastSyncTime: new Date(),
    totalEntities: 0,
    pendingCount: 0,
    conflictCount: 0,
    errorCount: 0,
    isOnline: false,
    isSyncing: false,
  });

  private syncProgressSubject = new BehaviorSubject<SyncProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    currentOperation: '',
    isComplete: true,
    errors: [],
  });

  public syncMetadata$ = this.syncMetadataSubject.asObservable();
  public syncProgress$ = this.syncProgressSubject.asObservable();

  // ==================== STATE ====================

  private isOnline = false;
  private syncInProgress = false;

  // ==================== INITIALIZATION ====================

  constructor() {
    this.initializeNetworkMonitoring();
    this.initializeAutoSync();
  }

  /**
   * مراقبة حالة الاتصال بالإنترنت
   */
  private initializeNetworkMonitoring(): void {
    // Check initial network status
    Network.getStatus()
      .then((status: any) => {
        this.isOnline = status.connected;
        this.updateSyncMetadata({ isOnline: this.isOnline });
        console.log('📡 Network status:', this.isOnline ? 'Online' : 'Offline');
      })
      .catch(() => {
        // Fallback to browser online status
        this.isOnline = navigator.onLine;
        this.updateSyncMetadata({ isOnline: this.isOnline });
      });

    // Listen for network changes
    Network.addListener('networkStatusChange', (status: any) => {
      const wasOnline = this.isOnline;
      this.isOnline = status.connected;
      this.updateSyncMetadata({ isOnline: this.isOnline });

      console.log(
        '📡 Network changed:',
        wasOnline ? 'Online' : 'Offline',
        '→',
        this.isOnline ? 'Online' : 'Offline'
      );

      // Auto-sync when coming back online
      if (!wasOnline && this.isOnline && this.syncConfig.autoSync) {
        console.log('🔄 Network restored, starting auto-sync...');
        this.syncAll().subscribe({
          next: (success) => console.log('✅ Auto-sync completed:', success),
          error: (err) => console.error('❌ Auto-sync failed:', err),
        });
      }
    }).catch(() => {
      console.warn('⚠️ Network listener not available, using browser events');
    });
  }

  /**
   * تفعيل المزامنة التلقائية
   */
  private initializeAutoSync(): void {
    if (this.syncConfig.autoSync && this.syncConfig.syncInterval > 0) {
      interval(this.syncConfig.syncInterval)
        .pipe(
          filter(() => this.isOnline && !this.syncInProgress),
          switchMap(() => {
            console.log('⏰ Auto-sync triggered');
            return this.syncAll();
          })
        )
        .subscribe({
          next: (success) =>
            console.log('✅ Auto-sync:', success ? 'Success' : 'Failed'),
          error: (err) => console.error('❌ Auto-sync error:', err),
        });
    }
  }

  // ==================== MAIN SYNC OPERATION ====================

  /**
   * 🔄 المزامنة الكاملة (Full Sync)
   *
   * الخطوات:
   * 1. Pull البيانات من السيرفر
   * 2. دمجها مع البيانات المحلية
   * 3. Push التغييرات المحلية إلى السيرفر
   */
  syncAll(): Observable<boolean> {
    // Check if sync is already running
    if (this.syncInProgress) {
      console.log('⚠️ Sync already in progress, skipping...');
      return of(false);
    }

    // Check if online
    if (!this.isOnline) {
      console.log('⚠️ Device is offline, cannot sync');
      return of(false);
    }

    // Start sync
    this.syncInProgress = true;
    this.updateSyncMetadata({ isSyncing: true });
    this.updateSyncProgress({
      current: 0,
      total: 100,
      percentage: 0,
      currentOperation: 'Starting sync...',
      isComplete: false,
      errors: [],
    });

    console.log('🔄 Starting full sync...');

    // Step 1: Pull data from server
    return this.pullDataFromServer().pipe(
      tap(() => {
        this.updateSyncProgress({
          current: 50,
          percentage: 50,
          currentOperation: 'Pulling data from server...',
        });
      }),
      switchMap((pullResult) => {
        console.log(
          `✅ Pulled ${pullResult.entities?.length || 0} entities from server`
        );

        // Step 2: Merge with local data
        return this.mergeWithLocalData(pullResult.entities || []).pipe(
          tap(() => {
            this.updateSyncProgress({
              current: 75,
              percentage: 75,
              currentOperation: 'Merging data...',
            });
          }),
          switchMap(() => {
            // Step 3: Push local pending changes
            return this.pushLocalChanges();
          })
        );
      }),
      tap(() => {
        this.updateSyncProgress({
          current: 100,
          percentage: 100,
          currentOperation: 'Sync completed',
          isComplete: true,
        });
        this.completeSync();
      }),
      map(() => true),
      catchError((error) => {
        console.error('❌ Sync error:', error);
        this.updateSyncProgress({
          errors: [error.message || 'Unknown sync error'],
          isComplete: true,
        });
        this.completeSync();
        return of(false);
      }),
      finalize(() => {
        this.syncInProgress = false;
        this.updateSyncMetadata({ isSyncing: false });
        console.log('🏁 Sync process finished');
      })
    );
  }

  // ==================== PULL DATA FROM SERVER ====================

  /**
   * 📥 Pull البيانات من السيرفر
   */
  private pullDataFromServer(): Observable<any> {
    const lastSyncTime = this.syncMetadataSubject.value.lastSyncTime;

    console.log('📥 Pulling data from server...');
    console.log('📅 Last sync time:', lastSyncTime);

    return this.apiService
      .get<any>('/sync/pull', {
        lastSyncTime: lastSyncTime?.toISOString(),
        limit: this.syncConfig.batchSize,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Pull response:', {
            entitiesCount: response.entities?.length || 0,
            conflicts: response.conflicts?.length || 0,
            totalCount: response.totalCount,
          });
        }),
        catchError((error) => {
          console.error('❌ Pull error:', error);
          return of({
            entities: [],
            conflicts: [],
            totalCount: 0,
            hasMore: false,
          });
        })
      );
  }

  // ==================== MERGE WITH LOCAL DATA ====================

  /**
   * 🔀 دمج البيانات من السيرفر مع البيانات المحلية
   */
  private mergeWithLocalData(serverEntities: any[]): Observable<boolean> {
    if (!serverEntities || serverEntities.length === 0) {
      console.log('ℹ️ No server entities to merge');
      return of(true);
    }

    console.log(
      `🔀 Merging ${serverEntities.length} entities with local data...`
    );

    // Group entities by type
    const expenseEntities = serverEntities.filter(
      (e) => e._entityType === 'expense' || e._entityType === 'outcome'
    );
    const categoryEntities = serverEntities.filter(
      (e) => e._entityType === 'category'
    );

    const mergeObservables: Observable<any>[] = [];

    // Merge expenses
    if (expenseEntities.length > 0) {
      console.log(`💰 Merging ${expenseEntities.length} expenses...`);
      mergeObservables.push(
        this.offlineStorage.mergeEntities('expense', expenseEntities)
      );
    }

    // Merge categories
    if (categoryEntities.length > 0) {
      console.log(`📁 Merging ${categoryEntities.length} categories...`);
      mergeObservables.push(
        this.offlineStorage.mergeEntities('category', categoryEntities)
      );
    }

    if (mergeObservables.length === 0) {
      return of(true);
    }

    return from(
      Promise.all(mergeObservables.map((obs) => obs.toPromise()))
    ).pipe(
      map(() => {
        console.log('✅ Merge completed');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Merge error:', error);
        return of(false);
      })
    );
  }

  // ==================== PUSH LOCAL CHANGES ====================

  /**
   * 📤 Push التغييرات المحلية إلى السيرفر
   */
  private pushLocalChanges(): Observable<boolean> {
    console.log('📤 Checking for pending local changes...');

    return this.offlineStorage.getPendingOperations().pipe(
      switchMap((operations) => {
        if (!operations || operations.length === 0) {
          console.log('ℹ️ No pending operations to push');
          return of(true);
        }

        console.log(`📤 Pushing ${operations.length} pending operations...`);

        // Convert operations to entities format
        const entities = operations.map((op) => ({
          _id: op.entityId,
          _entityType: op.entityType,
          _lastModified: op.timestamp,
          _version: 1,
          _isDeleted: op.type === 'DELETE',
          ...op.data,
        }));

        return this.apiService.post<any>('/sync/push', { entities }).pipe(
          tap((result) => {
            console.log('✅ Push result:', result);

            // Remove successful operations from queue
            if (result?.success) {
              operations.forEach((op) => {
                this.offlineStorage.removeFromSyncQueue(op.id);
              });
            }

            // Update conflict count if any
            if (result?.conflicts && result.conflicts.length > 0) {
              this.updateSyncMetadata({
                conflictCount: result.conflicts.length,
              });
            }
          }),
          map((result) => !!result?.success),
          catchError((error) => {
            console.error('❌ Push error:', error);
            this.updateSyncProgress({
              errors: [error.message || 'Push failed'],
            });
            return of(false);
          })
        );
      })
    );
  }

  // ==================== SYNC COMPLETION ====================

  /**
   * ✅ إكمال المزامنة
   */
  private completeSync(): void {
    const now = new Date();
    this.updateSyncMetadata({
      lastSyncTime: now,
      isSyncing: false,
    });

    this.updateSyncProgress({
      isComplete: true,
      currentOperation: 'Sync completed',
      percentage: 100,
    });

    console.log('✅ Sync completed at:', now);
  }

  // ==================== MANUAL SYNC TRIGGERS ====================

  /**
   * 🔄 Force Sync (Manual)
   */
  forceSync(): Observable<boolean> {
    console.log('🔄 Force sync requested');
    return this.syncAll();
  }

  // ==================== CONFLICT RESOLUTION ====================

  /**
   * حل التعارض
   */
  resolveConflict(resolution: any): Observable<boolean> {
    console.log('🔧 Resolving conflict:', resolution);

    if (!this.isOnline) {
      console.warn('⚠️ Cannot resolve conflict while offline');
      return of(false);
    }

    return this.apiService
      .post<any>('/sync/conflicts/resolve', {
        entityId: resolution.entityId,
        entityType: resolution.entityType,
        resolution: resolution.resolution,
        mergedData: resolution.mergedData,
      })
      .pipe(
        tap((result) => {
          console.log('✅ Conflict resolved:', result);
          // Update conflict count
          const currentConflicts = this.syncMetadataSubject.value.conflictCount;
          this.updateSyncMetadata({
            conflictCount: Math.max(0, currentConflicts - 1),
          });
        }),
        map(() => true),
        catchError((error) => {
          console.error('❌ Conflict resolution error:', error);
          return of(false);
        })
      );
  }

  /**
   * الحصول على التعارضات من السيرفر
   */
  getConflicts(): Observable<any[]> {
    if (!this.isOnline) {
      return of([]);
    }

    return this.apiService.get<any[]>('/sync/conflicts').pipe(
      tap((conflicts) => {
        console.log(`📋 Fetched ${conflicts.length} conflicts`);
        this.updateSyncMetadata({ conflictCount: conflicts.length });
      }),
      catchError((error) => {
        console.error('❌ Error fetching conflicts:', error);
        return of([]);
      })
    );
  }

  // ==================== CONFIGURATION ====================

  updateConfig(config: Partial<SyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    console.log('⚙️ Sync config updated:', this.syncConfig);
  }

  getConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  // ==================== STATUS QUERIES ====================

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  getPendingCount(): Observable<number> {
    return this.syncMetadata$.pipe(map((metadata) => metadata.pendingCount));
  }

  getConflictCount(): Observable<number> {
    return this.syncMetadata$.pipe(map((metadata) => metadata.conflictCount));
  }

  // ==================== UTILITY METHODS ====================

  private updateSyncMetadata(updates: Partial<SyncMetadata>): void {
    this.syncMetadataSubject.next({
      ...this.syncMetadataSubject.value,
      ...updates,
    });
  }

  private updateSyncProgress(updates: Partial<SyncProgress>): void {
    this.syncProgressSubject.next({
      ...this.syncProgressSubject.value,
      ...updates,
    });
  }
}
