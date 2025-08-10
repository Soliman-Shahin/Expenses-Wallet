import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
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
