import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { SyncService } from 'src/app/core/services/sync.service';
import { SyncIndicatorState } from 'src/app/shared/models/sync.model';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [IonicModule, TranslateModule, AsyncPipe],
  templateUrl: './sync-indicator.component.html',
  styleUrls: ['./sync-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncIndicatorComponent {
  private readonly router = inject(Router);
  readonly state$ = inject(SyncService).syncIndicatorState$;

  label(state: SyncIndicatorState): string {
    if (state.hasSyncErrors) return 'SYNC.INDICATOR_ISSUES';
    if (state.isSyncing) return 'SYNC.INDICATOR_SYNCING';
    if (state.isOffline) return 'SYNC.INDICATOR_WAITING';
    return 'SYNC.INDICATOR_PENDING';
  }

  icon(state: SyncIndicatorState): string {
    if (state.hasSyncErrors) return 'alert-circle-outline';
    if (state.isSyncing) return 'sync-outline';
    if (state.isOffline) return 'cloud-offline-outline';
    return 'cloud-upload-outline';
  }

  navigate(): void {
    if (!this.router.url.includes('/settings/sync')) {
      void this.router.navigate(['/settings/sync']);
    }
  }
}
