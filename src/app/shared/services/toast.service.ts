import { inject, Injectable } from '@angular/core';
import {
  ToastController,
  Animation,
  AnimationController,
} from '@ionic/angular';

// Custom Toast Animations (fade/slide/scale)
export const customToastEnterAnimation = (baseEl: HTMLElement): Animation => {
  const wrapperEl = baseEl.querySelector('.toast-wrapper') as HTMLElement;

  const backdropAnimation = new AnimationController()
    .create()
    .addElement(wrapperEl)
    .duration(440)
    .easing('cubic-bezier(0.4, 0, 0.2, 1)')
    .fromTo('opacity', '0', '1')
    .fromTo(
      'transform',
      'translateY(30px) scale(0.96)',
      'translateY(0) scale(1)'
    );

  // Add a subtle glow effect during entrance
  const glowAnimation = new AnimationController()
    .create()
    .addElement(wrapperEl)
    .duration(440)
    .easing('cubic-bezier(0.4, 0, 0.2, 1)')
    .fromTo(
      'box-shadow',
      '0 0 0 0 rgba(67, 97, 238, 0)',
      '0 8px 32px rgba(67, 97, 238, 0.14)'
    );

  return new AnimationController()
    .create()
    .addElement(baseEl)
    .addAnimation([backdropAnimation, glowAnimation]);
};

export const customToastLeaveAnimation = (baseEl: HTMLElement): Animation => {
  const wrapperEl = baseEl.querySelector('.toast-wrapper') as HTMLElement;

  const backdropAnimation = new AnimationController()
    .create()
    .addElement(wrapperEl)
    .duration(360)
    .easing('cubic-bezier(0.4, 0, 0.2, 1)')
    .fromTo('opacity', '1', '0')
    .fromTo(
      'transform',
      'translateY(0) scale(1)',
      'translateY(24px) scale(0.95)'
    );

  // Add a subtle glow effect during exit
  const glowAnimation = new AnimationController()
    .create()
    .addElement(wrapperEl)
    .duration(360)
    .easing('cubic-bezier(0.4, 0, 0.2, 1)')
    .fromTo(
      'box-shadow',
      '0 8px 32px rgba(67, 97, 238, 0.14)',
      '0 0 0 0 rgba(67, 97, 238, 0)'
    );

  return new AnimationController()
    .create()
    .addElement(baseEl)
    .addAnimation([backdropAnimation, glowAnimation]);
};

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toastController = inject(ToastController);
  private activeToast?: HTMLIonToastElement | null;

  constructor() {}

  private async dismissActiveToast(): Promise<void> {
    try {
      if (this.activeToast) {
        await this.activeToast.dismiss();
      }
    } catch {}
    this.activeToast = null;
  }

  private async presentToast(
    position: 'top' | 'middle' | 'bottom',
    message: string,
    color: 'success' | 'danger' | 'primary' | 'warning' | 'medium'
  ): Promise<HTMLIonToastElement | void> {
    await this.dismissActiveToast();

    let toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position,
      cssClass: 'custom-toast',
      enterAnimation: customToastEnterAnimation,
      leaveAnimation: customToastLeaveAnimation,
      keyboardClose: true,
      animated: true,
    });

    // Set ARIA attributes for accessibility
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    try {
      this.activeToast = toast;
      await toast.present();
      return toast;
    } catch (e) {
      // Fallback without custom animations (e.g., during rapid route changes)
      try {
        toast = await this.toastController.create({
          message,
          duration: 2000,
          color,
          position,
          cssClass: 'custom-toast',
          keyboardClose: true,
          animated: true,
        });
        this.activeToast = toast;
        await toast.present();
        return toast;
      } catch {
        return;
      }
    }
  }

  async presentSuccessToast(
    position: 'top' | 'middle' | 'bottom',
    message: string
  ): Promise<HTMLIonToastElement | void> {
    return this.presentToast(position, message, 'success');
  }

  async presentErrorToast(
    position: 'top' | 'middle' | 'bottom',
    message: string
  ): Promise<HTMLIonToastElement | void> {
    return this.presentToast(position, message, 'danger');
  }
}
