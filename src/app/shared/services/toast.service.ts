import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toastController = inject(ToastController);

  constructor() {}

  async presentSuccessToast(
    position: 'top' | 'middle' | 'bottom',
    message: string
  ) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: 'success',
      position: position,
    });
    toast.present();
  }

  async presentErrorToast(
    position: 'top' | 'middle' | 'bottom',
    message: string
  ) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: 'danger',
      position: position,
    });
    toast.present();
  }
}
