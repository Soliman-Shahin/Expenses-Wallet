import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingMap: Map<string, boolean> = new Map<string, boolean>();

  /**
   * Observable that emits the current loading state
   */
  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Set loading state for a specific loading task
   * @param loadingId Unique identifier for the loading task
   * @param loading Loading state to set
   */
  setLoading(loadingId: string, loading: boolean): void {
    if (!loadingId) {
      throw new Error('Loading ID is required');
    }

    if (loading) {
      this.loadingMap.set(loadingId, true);
      this.loadingSubject.next(true);
    } else {
      if (this.loadingMap.has(loadingId)) {
        this.loadingMap.delete(loadingId);
      }

      // Only set loading to false when no more loading tasks are in progress
      if (this.loadingMap.size === 0) {
        this.loadingSubject.next(false);
      }
    }
  }

  /**
   * Check if any loading tasks are in progress
   */
  get isLoading(): boolean {
    return this.loadingMap.size > 0;
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingMap.clear();
    this.loadingSubject.next(false);
  }
}
