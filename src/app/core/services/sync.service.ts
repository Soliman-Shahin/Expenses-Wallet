import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, from, of, interval } from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  tap,
  filter,
  finalize,
  distinctUntilChanged,
} from 'rxjs/operators';
import { ApiService } from './api.service';
import { OfflineStorageService } from './offline-storage.service';
import { ConnectionService } from './connection.service';
import {
  SyncStatus,
  SyncMetadata,
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
  private connectionService = inject(ConnectionService);

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

  /** Key used to persist lastSyncTime in localStorage as fallback */
  private readonly LAST_SYNC_KEY = 'sync_lastSyncTime';

  // ==================== INITIALIZATION ====================

  constructor() {
    this.loadConfig();
    this.loadLastSyncTime();
    this.initializeNetworkMonitoring();
    this.initializeAutoSync();
    this.initializeQueueMonitoring();
  }

  private initializeQueueMonitoring(): void {
    // Monitor offline queue and update metadata
    this.offlineStorage.syncQueue$.subscribe((queue) => {
      const pendingCount = queue.operations.filter(op => op.status === SyncStatus.PENDING).length;
      const errorCount = queue.operations.filter(op => op.status === SyncStatus.ERROR).length;
      
      this.updateSyncMetadata({
        pendingCount,
        errorCount,
      });
      
      // Also update total entities count occasionally
      this.offlineStorage.getStorageSize().subscribe(totalEntities => {
        this.updateSyncMetadata({ totalEntities });
      });
    });
  }

  private async loadConfig() {
    try {
      const stored = localStorage.getItem('sync_config');
      if (stored) {
        this.syncConfig = { ...this.syncConfig, ...JSON.parse(stored) };
        if (this.syncConfig.syncInterval < 60000) {
          this.syncConfig.syncInterval = 300000; // Reset to 5 mins if too low
        }
        console.log('⚙️ Loaded sync config:', this.syncConfig);
      }
    } catch (e) {
      console.warn('Could not load sync config', e);
    }
  }

  /**
   * مراقبة حالة الاتصال - مربوط بـ ConnectionService للدقة الكاملة
   * يستخدم backendReachable (health check) وليس navigator.onLine فقط
   */
  private initializeNetworkMonitoring(): void {
    this.connectionService
      .getConnectionStatus()
      .pipe(
        map((status) => status.online && status.backendReachable),
        distinctUntilChanged()
      )
      .subscribe((isOnline) => {
        const wasOnline = this.isOnline;
        this.isOnline = isOnline;
        this.updateSyncMetadata({ isOnline });

        console.log(
          '📡 Connection changed:',
          wasOnline ? 'Online' : 'Offline',
          '→',
          isOnline ? 'Online (backend reachable)' : 'Offline'
        );

        // Auto-sync when coming back online (backend is reachable)
        if (!wasOnline && isOnline && this.syncConfig.autoSync) {
          console.log('🔄 Connection restored, starting auto-sync...');
          // Small delay to let connection stabilize
          setTimeout(() => {
            this.syncAll().subscribe({
              next: (success) =>
                console.log('✅ Auto-sync completed:', success),
              error: (err) => console.error('❌ Auto-sync failed:', err),
            });
          }, 1500);
        }
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

    // Step 1: Push local pending changes to server
    return this.pushLocalChanges().pipe(
      tap(() => {
        this.updateSyncProgress({
          current: 33,
          percentage: 33,
          currentOperation: 'Pushing local changes...',
        });
      }),
      switchMap(() => {
        // Step 2: Pull latest data from server
        return this.pullDataFromServer().pipe(
          tap(() => {
            this.updateSyncProgress({
              current: 66,
              percentage: 66,
              currentOperation: 'Pulling data from server...',
            });
          }),
          switchMap((pullResult) => {
            console.log(
              `✅ Pulled ${pullResult.entities?.length || 0} entities from server`
            );

            // Step 3: Merge with local data
            return this.mergeWithLocalData(pullResult.entities || []).pipe(
              tap(() => {
                this.updateSyncProgress({
                  current: 90,
                  percentage: 90,
                  currentOperation: 'Merging data...',
                });
              })
            );
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

            // Remove successful operations from queue and delete local offline duplicate
            if (result?.success) {
              operations.forEach((op) => {
                this.offlineStorage.removeFromSyncQueue(op.id);
                if (op.entityId.startsWith('offline_')) {
                  this.offlineStorage.removeEntityHard(op.entityType, op.entityId);
                }
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
   * ✅ إكمال المزامنة وحفظ الوقت بشكل دائم
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

    // 💾 Persist lastSyncTime so it survives app restarts
    this.persistLastSyncTime(now);

    console.log('✅ Sync completed at:', now);
  }

  /**
   * 💾 حفظ آخر وقت مزامنة في localStorage
   */
  private persistLastSyncTime(time: Date): void {
    try {
      localStorage.setItem(this.LAST_SYNC_KEY, time.toISOString());
    } catch (e) {
      console.warn('Could not persist lastSyncTime', e);
    }
  }

  /**
   * 📂 تحميل آخر وقت مزامنة محفوظ عند بدء التشغيل
   */
  private loadLastSyncTime(): void {
    try {
      const stored = localStorage.getItem(this.LAST_SYNC_KEY);
      if (stored) {
        const lastSyncTime = new Date(stored);
        if (!isNaN(lastSyncTime.getTime())) {
          this.updateSyncMetadata({ lastSyncTime });
          console.log('📂 Loaded lastSyncTime:', lastSyncTime);
        }
      }
    } catch (e) {
      console.warn('Could not load lastSyncTime', e);
    }
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
    localStorage.setItem('sync_config', JSON.stringify(this.syncConfig));
    console.log('⚙️ Sync config updated:', this.syncConfig);
  }

  getConfig(): SyncConfig {
    // Try to load from storage if needed, but for now we just return the in-memory one
    // Let's assume it's loaded during initialization.
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
