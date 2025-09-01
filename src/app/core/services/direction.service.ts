import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  private renderer: Renderer2;
  private rendererFactory = inject(RendererFactory2);
  private translate = inject(TranslateService);

  private direction = new BehaviorSubject<'ltr' | 'rtl'>('ltr');
  direction$ = this.direction.asObservable();

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.translate.onLangChange.subscribe((event) => {
      const newDir = event.lang === 'ar' ? 'rtl' : 'ltr';
      this.direction.next(newDir);
      this.renderer.setAttribute(document.body, 'dir', newDir);
    });
  }

  get currentDirection(): 'ltr' | 'rtl' {
    return this.direction.getValue();
  }
}
