import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private buttonConfig = new BehaviorSubject<{
    title?: string;
    action?: string;
    icon?: string;
    callback?: () => void;
    route?: string;
  }>({});

  buttonConfig$ = this.buttonConfig.asObservable();

  updateButtonConfig(config: {
    title?: string;
    action?: string;
    icon?: string;
    callback?: () => void;
    route?: string;
  }) {
    this.buttonConfig.next(config);
  }

  clearButtonConfig() {
    this.buttonConfig.next({});
  }
}
