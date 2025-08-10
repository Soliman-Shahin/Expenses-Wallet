import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './section-header.component.html',
  styleUrls: ['./section-header.component.scss'],
})
export class SectionHeaderComponent {
  @Input() icon?: string;
  @Input() title!: string;
  @Input() ariaLabel?: string;

  // Optional CTA
  @Input() ctaText?: string;
  @Input() ctaIcon: string = 'arrow-forward';
  @Input() ctaRouterLink?: string | any[];
  @Input() ctaDisabled: boolean = false;

  @Output() ctaClick = new EventEmitter<void>();
}
