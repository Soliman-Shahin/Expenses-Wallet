import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type SkeletonVariant =
  | 'line'
  | 'title'
  | 'card-sm'
  | 'card-md'
  | 'card-lg'
  | 'card-xl'
  | 'chart';

@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './skeleton-block.component.html',
  styleUrls: ['./skeleton-block.component.scss'],
})
export class SkeletonBlockComponent {
  @Input() variant: SkeletonVariant = 'line';
}
