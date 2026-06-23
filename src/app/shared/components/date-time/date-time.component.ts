import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-date-time',
    templateUrl: './date-time.component.html',
    styleUrls: ['./date-time.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IonicModule]
})
export class DateTimeComponent {
  constructor() {}
}
