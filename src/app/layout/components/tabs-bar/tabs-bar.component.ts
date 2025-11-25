import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NavigationEnd, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';
import { TABS_MENU_ITEMS } from 'src/app/core/constants';
import { BaseComponent } from 'src/app/shared/base';
import { Tab } from 'src/app/shared/models';

@Component({
  standalone: true,
  selector: 'app-tabs-bar',
  templateUrl: './tabs-bar.component.html',
  styleUrls: ['./tabs-bar.component.scss'],
  imports: [CommonModule, RouterModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsBarComponent extends BaseComponent implements OnInit {
  tabs: Tab[] = TABS_MENU_ITEMS;

  private readonly activeRoute$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects.split('?')[0]),
    startWith(this.router.url.split('?')[0]),
    takeUntil(this.destroy$)
  );

  readonly vm$ = combineLatest({
    isLoggedIn: this.authService.isLoggedIn$,
    activeRoute: this.activeRoute$,
  });

  constructor() {
    super();
  }

  navigateTab(link: string, event: Event) {
    event.preventDefault();
    console.log('Tab click:', link);
    this.router.navigateByUrl(link, { replaceUrl: false });
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }
}
