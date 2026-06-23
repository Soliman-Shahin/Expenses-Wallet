import { Component, ChangeDetectionStrategy,  } from '@angular/core';
import { OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { IonicModule } from '@ionic/angular';
import { SideMenuComponent } from '../../components/side-menu/side-menu.component';
import { TabsBarComponent } from '../../components/tabs-bar/tabs-bar.component';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IonicModule, SideMenuComponent, TabsBarComponent, AsyncPipe, TranslateModule]
})
export class LayoutComponent
  extends BaseComponent
  implements OnInit
{
  isLoggedIn$!: Observable<boolean>;
  message$!: Observable<string | null>;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.message$ = this.loadingService.message$;

    this.loadingService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.setLoading(loading);
        this.cdr.markForCheck();
      });
  }
}
