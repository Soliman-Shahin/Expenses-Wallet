import { Component } from '@angular/core';
import { ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { LoadingService } from 'src/app/core/services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  isLoading = false;
  private loadingSub?: Subscription;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
