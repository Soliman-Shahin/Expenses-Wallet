import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ComponentStateService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  reset(): void {
    this.loading.set(false);
    this.error.set(null);
  }
}
