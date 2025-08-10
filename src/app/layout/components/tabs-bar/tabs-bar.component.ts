import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TABS_MENU_ITEMS } from 'src/app/core/constants';
import { Tab } from 'src/app/shared/models';

@Component({
  selector: 'app-tabs-bar',
  templateUrl: './tabs-bar.component.html',
  styleUrls: ['./tabs-bar.component.scss'],
})
export class TabsBarComponent {
  tabs: Tab[] = TABS_MENU_ITEMS;
  activeRoute: string = '';
  isLoggedIn$: Observable<boolean>;

  constructor(private router: Router, private auth: AuthService) {
    this.isLoggedIn$ = this.auth.user$.pipe(map((u) => !!u));
    this.activeRoute = this.router.url.split('?')[0];
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeRoute = event.urlAfterRedirects.split('?')[0];
      }
    });
  }
}
