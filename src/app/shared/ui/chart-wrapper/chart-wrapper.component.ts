
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SkeletonBlockComponent } from '../skeleton-block/skeleton-block.component';

@Component({
  selector: 'app-chart-wrapper',
  templateUrl: './chart-wrapper.component.html',
  styleUrls: ['./chart-wrapper.component.scss'],
  standalone: true,
  imports: [IonicModule, SkeletonBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartWrapperComponent {
  @Input() chartTitle: string = '';
  @Input() isLoading: boolean = false;
  @Input() hasError: boolean = false;
  @Input() errorMessage: string = 'An error occurred.';
}
