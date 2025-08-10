import { Component } from '@angular/core';
import { ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from 'src/app/core/services/loading.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  isLoading = false;
  private loadingSub?: Subscription;
  isLoggedIn$!: Observable<boolean>;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.user$.pipe(map((u) => !!u));
    this.loadingSub = this.loadingService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.loadingSub) {
      this.loadingSub.unsubscribe();
    }
  }
}
