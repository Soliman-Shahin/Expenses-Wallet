import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SyncService } from 'src/app/core/services/sync.service';
import { Subject, takeUntil } from 'rxjs';
import { SyncMetadata, SyncProgress } from 'src/app/shared/models/sync.model';

/**
 * 🧪 Sync Test Page
 * صفحة اختبار نظام المزامنة
 */
@Component({
  selector: 'app-sync-test',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🧪 Sync System Test</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Network Status -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📡 Network Status</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-icon
              [name]="metadata?.isOnline ? 'wifi' : 'wifi-outline'"
              [color]="metadata?.isOnline ? 'success' : 'danger'"
              slot="start"
              >
            </ion-icon>
            <ion-label>
              <h2>{{ metadata?.isOnline ? 'Online' : 'Offline' }}</h2>
              <p>Network connection status</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>
    
      <!-- Sync Status -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>🔄 Sync Status</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-icon
              [name]="metadata?.isSyncing ? 'sync' : 'sync-outline'"
              [color]="metadata?.isSyncing ? 'warning' : 'success'"
              slot="start"
              >
            </ion-icon>
            <ion-label>
              <h2>{{ metadata?.isSyncing ? 'Syncing...' : 'Ready' }}</h2>
              <p>Sync operation status</p>
            </ion-label>
          </ion-item>
    
          <ion-item>
            <ion-icon name="time-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Last Sync</h2>
              <p>{{ metadata?.lastSyncTime | date : 'medium' }}</p>
            </ion-label>
          </ion-item>
    
          <ion-item>
            <ion-icon name="documents-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Total Entities</h2>
              <p>{{ metadata?.totalEntities || 0 }}</p>
            </ion-label>
          </ion-item>
    
          <ion-item>
            <ion-icon
              name="hourglass-outline"
              color="warning"
              slot="start"
            ></ion-icon>
            <ion-label>
              <h2>Pending</h2>
              <p>{{ metadata?.pendingCount || 0 }} operations</p>
            </ion-label>
          </ion-item>
    
          <ion-item>
            <ion-icon
              name="alert-circle-outline"
              color="danger"
              slot="start"
            ></ion-icon>
            <ion-label>
              <h2>Conflicts</h2>
              <p>{{ metadata?.conflictCount || 0 }} items</p>
            </ion-label>
          </ion-item>
    
          <ion-item>
            <ion-icon
              name="close-circle-outline"
              color="danger"
              slot="start"
            ></ion-icon>
            <ion-label>
              <h2>Errors</h2>
              <p>{{ metadata?.errorCount || 0 }} errors</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>
    
      <!-- Sync Progress -->
      @if (progress && !progress.isComplete) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>📊 Sync Progress</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>
                <h2>{{ progress.currentOperation }}</h2>
                <p>{{ progress.current }} / {{ progress.total }}</p>
              </ion-label>
            </ion-item>
            <ion-progress-bar [value]="progress.percentage / 100" color="primary">
            </ion-progress-bar>
            <p class="ion-text-center ion-margin-top">
              {{ progress.percentage }}%
            </p>
            @if (progress.errors.length > 0) {
              <ion-list>
                @for (error of progress.errors; track error) {
                  <ion-item color="danger">
                    <ion-icon name="warning-outline" slot="start"></ion-icon>
                    <ion-label>{{ error }}</ion-label>
                  </ion-item>
                }
              </ion-list>
            }
          </ion-card-content>
        </ion-card>
      }
    
      <!-- Sync Actions -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>🎮 Actions</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-button
            expand="block"
            (click)="forceSync()"
            [disabled]="metadata?.isSyncing || !metadata?.isOnline"
            >
            <ion-icon name="sync" slot="start"></ion-icon>
            Force Sync
          </ion-button>
    
          <ion-button expand="block" fill="outline" (click)="refreshMetadata()">
            <ion-icon name="refresh" slot="start"></ion-icon>
            Refresh
          </ion-button>
    
          <ion-button
            expand="block"
            fill="outline"
            color="secondary"
            (click)="logStatus()"
            >
            <ion-icon name="bug-outline" slot="start"></ion-icon>
            Log to Console
          </ion-button>
        </ion-card-content>
      </ion-card>
    
      <!-- Console Output -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📝 Console Output</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="console-output">
            <pre>{{ consoleOutput }}</pre>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
    `,
  styles: [
    `
      .console-output {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 16px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
      }

      .console-output pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      ion-card {
        margin: 16px 0;
      }

      ion-button {
        margin: 8px 0;
      }
    `,
  ],
})
export class SyncTestPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  metadata: SyncMetadata | null = null;
  progress: SyncProgress | null = null;
  consoleOutput: string = 'Waiting for sync operations...\n';

  private syncService = inject(SyncService);

  ngOnInit(): void {
    this.log('🧪 Sync Test Page initialized');

    // Subscribe to sync metadata
    this.syncService.syncMetadata$
      .pipe(takeUntil(this.destroy$))
      .subscribe((metadata) => {
        this.metadata = metadata;
        this.log('📊 Metadata updated:', JSON.stringify(metadata, null, 2));
      });

    // Subscribe to sync progress
    this.syncService.syncProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((progress) => {
        this.progress = progress;
        if (!progress.isComplete) {
          this.log(
            `📈 Progress: ${progress.percentage}% - ${progress.currentOperation}`
          );
        }
      });

    // Check initial status
    this.logStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  forceSync(): void {
    this.log('🔄 Force sync started...');
    this.consoleOutput = 'Starting force sync...\n';

    this.syncService.forceSync().subscribe({
      next: (success) => {
        if (success) {
          this.log('✅ Force sync completed successfully!');
        } else {
          this.log('⚠️ Force sync completed with warnings');
        }
      },
      error: (err) => {
        this.log('❌ Force sync error: ' + err.message);
        console.error('Sync error details:', err);
      },
    });
  }

  refreshMetadata(): void {
    this.log('🔄 Refreshing metadata...');
    // Metadata is automatically updated via observables
  }

  logStatus(): void {
    const status = {
      isOnline: this.syncService.isOnlineStatus(),
      isSyncing: this.syncService.isSyncInProgress(),
      config: this.syncService.getConfig(),
      metadata: this.metadata,
      progress: this.progress,
    };

    console.log('📊 Sync Status:', status);
    this.log('📊 Current Status:\n' + JSON.stringify(status, null, 2));
  }

  private log(message: string, data?: any): void {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;

    console.log(logMessage, data || '');
    this.consoleOutput += logMessage + '\n';

    if (data) {
      this.consoleOutput += JSON.stringify(data, null, 2) + '\n';
    }
  }
}
