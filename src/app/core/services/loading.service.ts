import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingMap: Map<string, boolean> = new Map<string, boolean>();
  private messageSubject = new BehaviorSubject<string | null>(null);
  private showDelayMs = 150; // avoid flicker for ultra-fast ops
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Observable that emits the current loading state
   */
  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Observable for the current loader message (if any)
   */
  get message$(): Observable<string | null> {
    return this.messageSubject.asObservable();
  }

  /**
   * Set loading state for a specific loading task
   * @param loadingId Unique identifier for the loading task
   * @param loading Loading state to set
   */
  setLoading(loadingId: string, loading: boolean, opts?: { message?: string | null; delayMs?: number }): void {
    if (!loadingId) {
      throw new Error('Loading ID is required');
    }

    if (loading) {
      // set a small delay before showing to avoid flicker
      const delay = opts?.delayMs ?? this.showDelayMs;
      const timerId = setTimeout(() => {
        this.loadingMap.set(loadingId, true);
        if (opts?.message !== undefined) {
          this.messageSubject.next(opts.message);
        }
        this.loadingSubject.next(true);
        this.pendingTimers.delete(loadingId);
      }, Math.max(0, delay));
      this.pendingTimers.set(loadingId, timerId);
    } else {
      if (this.loadingMap.has(loadingId)) {
        this.loadingMap.delete(loadingId);
      }
      // cancel any pending show timer
      const pending = this.pendingTimers.get(loadingId);
      if (pending) {
        clearTimeout(pending);
        this.pendingTimers.delete(loadingId);
      }

      // Only set loading to false when no more loading tasks are in progress
      if (this.loadingMap.size === 0) {
        this.loadingSubject.next(false);
        this.messageSubject.next(null);
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
    this.messageSubject.next(null);
    // clear any pending timers
    for (const [, t] of this.pendingTimers) {
      clearTimeout(t);
    }
    this.pendingTimers.clear();
  }

  /**
   * Helper to show the loader for a task id with optional message
   */
  show(loadingId: string, message?: string | null, delayMs?: number): void {
    this.setLoading(loadingId, true, { message: message ?? null, delayMs });
  }

  /**
   * Helper to hide the loader for a task id
   */
  hide(loadingId: string): void {
    this.setLoading(loadingId, false);
  }
}
