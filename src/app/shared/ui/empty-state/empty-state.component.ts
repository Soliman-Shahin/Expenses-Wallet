import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon: string = 'document';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() ariaLabel?: string;

  // Optional CTA
  @Input() ctaText?: string;
  @Input() ctaIcon: string = 'add';
  @Input() ctaRouterLink?: string | any[];
  @Input() ctaDisabled = false;

  @Output() ctaClick = new EventEmitter<void>();
}
