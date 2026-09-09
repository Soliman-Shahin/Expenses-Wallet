import { Injectable, signal, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';
import { NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ComponentStateService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private loadingService = inject(LoadingService);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) this.reset();
      });
  }

  setLoading(isLoading: boolean): void {
    if (this.loading() === isLoading) return;
    this.loading.set(isLoading);
    if (isLoading) {
      this.loadingService.show('component-state');
    } else {
      this.loadingService.hide('component-state');
    }
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  reset(): void {
    this.setLoading(false);
    this.error.set(null);
  }
}
