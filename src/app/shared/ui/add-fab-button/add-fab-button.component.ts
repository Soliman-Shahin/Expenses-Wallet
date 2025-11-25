import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-fab-button',
  templateUrl: './add-fab-button.component.html',
  styleUrls: ['./add-fab-button.component.scss'],
  standalone: true,
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFabButtonComponent {
  @Output() fabClick = new EventEmitter<void>();

  onClick(): void {
    this.fabClick.emit();
  }
}
