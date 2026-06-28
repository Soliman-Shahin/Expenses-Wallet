
import { Component, ChangeDetectionStrategy, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ICONS } from '../../models';

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-icon-selector',
  templateUrl: './icon-selector.component.html',
  styleUrls: ['./icon-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconSelectorComponent implements OnInit {
  @Output() icon = new EventEmitter<string>();
  @Input() selectedIcon?: string;
  @Input() themeColor?: string;
  
  icons: string[] = ICONS;

  constructor() {}

  ngOnInit() {}

  selectIcon(icon: string) {
    this.selectedIcon = icon;
    this.icon.emit(icon);
  }

  trackByIcon(index: number, icon: string): string {
    return icon;
  }
}
