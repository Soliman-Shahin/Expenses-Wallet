import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSignal = signal<boolean>(false);
  private messageSignal = signal<string | null>(null);

  // How many active `show()` calls are outstanding for each id.
  // Using a counter (instead of a boolean) makes concurrent/duplicate
  // show()/hide() calls for the same id safe — the loader only goes
  // away once every outstanding show() has been matched by a hide().
  private refCounts: Map<string, number> = new Map<string, number>();

  // Anti-flicker delay: we don't want to flash a spinner for an
  // operation that resolves in a few ms.
  private showDelayMs = 150;

  // Each show() call gets a monotonically increasing "generation" id.
  // If hide() is called before the delayed show() timer fires, we
  // bump the generation so the stale timer callback becomes a no-op
  // instead of turning the loader on after the fact.
  private generation: Map<string, number> = new Map<string, number>();
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly isLoading$: Observable<boolean> = toObservable(this.loadingSignal);
  readonly message$: Observable<string | null> = toObservable(this.messageSignal);

  /**
   * Show the loader for a given task id. Safe to call multiple times
   * concurrently for the same id (or different ids) — the loader will
   * only hide once every show() has a matching hide().
   */
  show(loadingId: string, message?: string | null, delayMs?: number): void {
    if (!loadingId) {
      throw new Error('Loading ID is required');
    }

    const currentCount = this.refCounts.get(loadingId) ?? 0;
    this.refCounts.set(loadingId, currentCount + 1);

    // Bump this id's generation. Any older pending timer for this id
    // will see a mismatched generation and bail out instead of
    // incorrectly turning the loader on.
    const myGeneration = (this.generation.get(loadingId) ?? 0) + 1;
    this.generation.set(loadingId, myGeneration);

    // Clear any previous pending timer for this id before scheduling
    // a new one, so we never leak timers.
    const existingTimer = this.pendingTimers.get(loadingId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const delay = delayMs ?? this.showDelayMs;
    const timerId = setTimeout(() => {
      this.pendingTimers.delete(loadingId);

      // Only apply this if: (a) this timer is still the latest
      // generation for this id, and (b) the id is still actually
      // outstanding (i.e. hide() hasn't already brought the count to 0).
      const isStillLatest = this.generation.get(loadingId) === myGeneration;
      const isStillActive = (this.refCounts.get(loadingId) ?? 0) > 0;

      if (isStillLatest && isStillActive) {
        if (message !== undefined) {
          this.messageSignal.set(message);
        }
        this.loadingSignal.set(true);
      }
    }, Math.max(0, delay));

    this.pendingTimers.set(loadingId, timerId);
  }

  /**
   * Hide the loader for a given task id. Decrements the reference
   * count for that id; the global loader signal only turns off once
   * every outstanding id has reached zero.
   */
  hide(loadingId: string): void {
    if (!loadingId) {
      throw new Error('Loading ID is required');
    }

    const currentCount = this.refCounts.get(loadingId) ?? 0;
    const nextCount = Math.max(0, currentCount - 1);

    if (nextCount === 0) {
      this.refCounts.delete(loadingId);

      // Bump generation so any in-flight delayed show() for this id
      // becomes a stale no-op.
      const myGeneration = (this.generation.get(loadingId) ?? 0) + 1;
      this.generation.set(loadingId, myGeneration);

      const pending = this.pendingTimers.get(loadingId);
      if (pending) {
        clearTimeout(pending);
        this.pendingTimers.delete(loadingId);
      }
    } else {
      this.refCounts.set(loadingId, nextCount);
    }

    this.recomputeGlobalLoading();
  }

  /**
   * True if any loading task is currently outstanding (regardless of
   * whether the anti-flicker delay has elapsed yet).
   */
  get isLoading(): boolean {
    return this.refCounts.size > 0;
  }

  /**
   * Force-clear all loading state. Useful as a safety net, e.g. on
   * navigation/logout, in case something got left outstanding.
   */
  clearAll(): void {
    this.refCounts.clear();
    for (const [, t] of this.pendingTimers) {
      clearTimeout(t);
    }
    this.pendingTimers.clear();
    this.generation.clear();
    this.loadingSignal.set(false);
    this.messageSignal.set(null);
  }

  private recomputeGlobalLoading(): void {
    if (this.refCounts.size === 0) {
      this.loadingSignal.set(false);
      this.messageSignal.set(null);
    }
  }
}