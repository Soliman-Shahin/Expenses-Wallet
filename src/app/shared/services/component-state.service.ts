import { Injectable, signal, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Injectable({
  providedIn: 'root',
})
export class ComponentStateService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  
  private loadingService = inject(LoadingService);

  setLoading(isLoading: boolean): void {
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
    this.loading.set(false);
    this.error.set(null);
    this.loadingService.hide('component-state');
  }
}
