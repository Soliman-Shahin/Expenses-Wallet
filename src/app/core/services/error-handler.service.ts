import { Injectable, ErrorHandler, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService implements ErrorHandler {
  private toastCtrl!: ToastController;

  constructor(private injector: Injector, private translate: TranslateService) {
    // Inject ToastController in constructor to avoid circular dependency
    setTimeout(() => {
      this.toastCtrl = this.injector.get(ToastController);
    });
  }

  /**
   * Global error handler for the application
   * @param error The error that occurred
   */
  async handleError(error: Error | HttpErrorResponse): Promise<void> {
    console.error('Global error handler:', error);

    if (error instanceof HttpErrorResponse) {
      // Handle HTTP errors
      await this.handleHttpError(error);
    } else {
      // Handle client-side errors
      await this.showError('errors.unexpected_error');
    }
  }

  /**
   * Show a warning message to the user
   * @param message Translation key for the warning message
   * @param header Optional translation key for the header
   */
  async showWarning(message: string, header?: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      header: header
        ? this.translate.instant(header)
        : this.translate.instant('common.warning'),
      message: this.translate.instant(message),
      duration: 5000,
      color: 'warning',
      position: 'top',
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  /**
   * Show an error message to the user
   * @param message Translation key for the error message
   * @param error Optional error object for logging
   */
  async showError(message: string, error?: any): Promise<void> {
    console.error('Error:', error || message);

    const toast = await this.toastCtrl.create({
      header: this.translate.instant('errors.error'),
      message: this.translate.instant(message),
      duration: 5000,
      color: 'danger',
      position: 'top',
      buttons: [
        {
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }

  /**
   * Handle HTTP errors
   * @param error HTTP error response
   */
  private async handleHttpError(error: HttpErrorResponse): Promise<void> {
    if (!navigator.onLine) {
      // Handle offline error
      await this.showError('errors.offline');
      return;
    }

    let errorMessage = 'errors.server_error';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'errors.client_error';
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'errors.bad_request';
          break;
        case 401:
          errorMessage = 'errors.unauthorized';
          // Handle unauthorized (e.g., redirect to login)
          break;
        case 403:
          errorMessage = 'errors.forbidden';
          break;
        case 404:
          errorMessage = 'errors.not_found';
          break;
        case 429:
          errorMessage = 'errors.too_many_requests';
          break;
        case 500:
          errorMessage = 'errors.server_error';
          break;
        default:
          errorMessage = 'errors.unknown_error';
      }
    }

    await this.showError(errorMessage);
  }
}
