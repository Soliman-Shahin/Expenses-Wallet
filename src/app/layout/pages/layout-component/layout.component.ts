import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/base/base.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
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
