import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface ConnectionStatus {
  online: boolean;
  backendReachable: boolean;
  lastChecked: Date;
}

/**
 * Connection Monitoring Service
 *
 * Features:
 * - Monitors internet connection status
 * - Checks backend API availability
 * - Provides observables for reactive updates
 * - Automatic health check polling
 */
@Injectable({
  providedIn: 'root',
})
export class ConnectionService {
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    online: navigator.onLine,
    backendReachable: false,
    lastChecked: new Date(),
  });

  private healthCheckInterval: any;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor(private http: HttpClient) {
    this.initializeConnectionMonitoring();
    this.startHealthCheck();
  }

  /**
   * Get connection status as observable
   */
  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Get current connection status
   */
  getCurrentStatus(): ConnectionStatus {
    return this.connectionStatus$.value;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.connectionStatus$.value.online;
  }

  /**
   * Check if backend is reachable
   */
  isBackendReachable(): boolean {
    return this.connectionStatus$.value.backendReachable;
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    // Monitor browser online/offline events
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
      .pipe(debounceTime(300))
      .subscribe((online) => {
        this.updateConnectionStatus({ online });

        // If back online, check backend immediately
        if (online) {
          this.checkBackendHealth();
        } else {
          this.updateConnectionStatus({ backendReachable: false });
        }
      });
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    // Initial check
    this.checkBackendHealth();

    // Periodic checks
    this.healthCheckInterval = setInterval(() => {
      if (this.isOnline()) {
        this.checkBackendHealth();
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Check backend health
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const healthUrl = `${environment.apiUrl.replace('/v1', '')}/health`;

      const response = await this.http
        .get<any>(healthUrl, {
          observe: 'response',
          // Don't retry health checks
          headers: { 'X-Skip-Retry': 'true' },
        })
        .toPromise();

      const isHealthy =
        response?.status === 200 && response?.body?.status === 'ok';

      this.updateConnectionStatus({
        backendReachable: isHealthy,
      });

      return isHealthy;
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error);
      this.updateConnectionStatus({
        backendReachable: false,
      });
      return false;
    }
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(updates: Partial<ConnectionStatus>): void {
    this.connectionStatus$.next({
      ...this.connectionStatus$.value,
      ...updates,
      lastChecked: new Date(),
    });
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
