import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private toastService: ToastService,
    private zone: NgZone
  ) {}

  handleError(error: Error | any): void {
    // Log error to console in development
    if (!environment.production) {
      console.error('🔴 [Global Error Handler]', error);
    }

    // Extract error message
    const message = this.getErrorMessage(error);

    // Show user-friendly toast
    this.zone.run(() => {
      this.toastService.presentErrorToast('bottom', message);
    });

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // this.logErrorToService(error);
  }

  private getErrorMessage(error: any): string {
    if (error?.rejection?.error?.message) {
      return error.rejection.error.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  // private logErrorToService(error: any): void {
  //   // TODO: Implement error logging service
  //   // Example: Sentry.captureException(error);
  // }
}
