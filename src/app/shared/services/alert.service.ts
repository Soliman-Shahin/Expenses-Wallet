import { Injectable, inject } from '@angular/core';
import { AlertController, AlertButton } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  inputs?: any[];
  cssClass?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertController = inject(AlertController);
  private translateService = inject(TranslateService);

  /**
   * Show a success alert
   */
  async showSuccess(message: string, title?: string): Promise<void> {
    return this.show({
      title: title || this.translateService.instant('COMMON.SUCCESS'),
      message,
      type: 'success',
      confirmText: this.translateService.instant('COMMON.OK'),
    });
  }

  /**
   * Show an error alert
   */
  async showError(message: string, title?: string): Promise<void> {
    return this.show({
      title: title || this.translateService.instant('COMMON.ERROR'),
      message,
      type: 'error',
      confirmText: this.translateService.instant('COMMON.OK'),
    });
  }

  /**
   * Show a warning alert
   */
  async showWarning(message: string, title?: string): Promise<void> {
    return this.show({
      title: title || this.translateService.instant('COMMON.WARNING'),
      message,
      type: 'warning',
      confirmText: this.translateService.instant('COMMON.OK'),
    });
  }

  /**
   * Show an info alert
   */
  async showInfo(message: string, title?: string): Promise<void> {
    return this.show({
      title: title || this.translateService.instant('COMMON.INFO'),
      message,
      type: 'info',
      confirmText: this.translateService.instant('COMMON.OK'),
    });
  }

  /**
   * Show a confirmation alert with Yes/No buttons
   */
  async showConfirm(options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        cssClass: 'custom-alert alert-confirm',
        header:
          options.title || this.translateService.instant('COMMON.CONFIRM'),
        message: options.message,
        buttons: [
          {
            text:
              options.cancelText ||
              this.translateService.instant('COMMON.CANCEL'),
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              resolve(false);
            },
          },
          {
            text:
              options.confirmText ||
              this.translateService.instant('COMMON.CONFIRM'),
            cssClass: 'alert-button-confirm',
            handler: () => {
              resolve(true);
            },
          },
        ],
      });

      await alert.present();
    });
  }

  /**
   * Show a delete confirmation alert
   */
  async showDeleteConfirm(
    itemName: string = '',
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> {
    const message = itemName
      ? this.translateService.instant('COMMON.DELETE_CONFIRM_ITEM', {
          item: itemName,
        })
      : this.translateService.instant('COMMON.DELETE_CONFIRM');

    const confirmed = await this.showConfirm({
      title: this.translateService.instant('COMMON.DELETE'),
      message,
      confirmText: this.translateService.instant('COMMON.DELETE'),
      cancelText: this.translateService.instant('COMMON.CANCEL'),
    });

    if (confirmed && onConfirm) {
      await onConfirm();
    }

    return confirmed;
  }

  /**
   * Show an alert with custom inputs (for prompt-like behavior)
   */
  async showPrompt(options: {
    title: string;
    message?: string;
    inputs: any[];
    confirmText?: string;
    cancelText?: string;
  }): Promise<any> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        cssClass: 'custom-alert alert-prompt',
        header: options.title,
        message: options.message,
        inputs: options.inputs,
        buttons: [
          {
            text:
              options.cancelText ||
              this.translateService.instant('COMMON.CANCEL'),
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              resolve(null);
            },
          },
          {
            text:
              options.confirmText || this.translateService.instant('COMMON.OK'),
            cssClass: 'alert-button-confirm',
            handler: (data) => {
              resolve(data);
            },
          },
        ],
      });

      await alert.present();
    });
  }

  /**
   * Generic show method with full customization
   */
  async show(options: AlertOptions): Promise<void> {
    const buttons: AlertButton[] = [
      {
        text: options.confirmText || this.translateService.instant('COMMON.OK'),
        cssClass: 'alert-button-confirm',
        handler: () => {
          if (options.onConfirm) {
            options.onConfirm();
          }
        },
      },
    ];

    if (options.cancelText) {
      buttons.unshift({
        text: options.cancelText,
        role: 'cancel',
        cssClass: 'alert-button-cancel',
        handler: () => {
          if (options.onCancel) {
            options.onCancel();
          }
        },
      });
    }

    const cssClasses = ['custom-alert'];
    if (options.type) {
      cssClasses.push(`alert-${options.type}`);
    }
    if (options.cssClass) {
      cssClasses.push(options.cssClass);
    }

    const alert = await this.alertController.create({
      cssClass: cssClasses.join(' '),
      header: options.title,
      message: options.message,
      inputs: options.inputs,
      buttons,
    });

    await alert.present();
  }

  /**
   * Dismiss all open alerts
   */
  async dismissAll(): Promise<void> {
    try {
      const alert = await this.alertController.getTop();
      if (alert) {
        await this.alertController.dismiss();
      }
    } catch (error) {
      // No alert to dismiss
    }
  }
}
