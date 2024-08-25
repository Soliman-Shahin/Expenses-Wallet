import { Component } from '@angular/core';
import { TABS_MENU_ITEMS } from 'src/app/core/constants';
import { Tab } from 'src/app/shared/models';

@Component({
  selector: 'app-tabs-bar',
  templateUrl: './tabs-bar.component.html',
  styleUrls: ['./tabs-bar.component.scss'],
})
export class TabsBarComponent {
  tabs: Tab[] = TABS_MENU_ITEMS;
}
