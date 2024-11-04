import { Component, inject, OnInit } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  ItemReorderEventDetail,
} from '@ionic/angular';
import { BehaviorSubject, finalize, switchMap, takeUntil, tap } from 'rxjs';
import { BaseListComponent } from 'src/app/shared/base';
import { Category } from '../../models';
import { CategoriesService } from '../../services';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent
  extends BaseListComponent<Category>
  implements OnInit
{
  private categoryService = inject(CategoriesService);

  sizeOptions = {
    pageSizeOptions: this.pageSizeOptions,
    pageSize: this.pageSize,
  };

  sortOptions = {
    sortBy: 'createdAt',
  };

  readonly #defaultParams = {
    skip: 0,
    limit: this.pageSize,
    sort: `-${this.sortOptions?.sortBy}`,
  };

  readonly #paramsSub = new BehaviorSubject({
    ...this.#defaultParams,
  });

  get activatedParams() {
    return this.#paramsSub.getValue();
  }

  isActionSheetOpen = false;
  public actionSheetButtons = [
    {
      text: 'Delete',
      role: 'destructive',
      data: {
        action: 'delete',
      },
    },
    {
      text: 'Edit',
      data: {
        action: 'edit',
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  constructor() {
    super();
  }

  ngOnInit() {
    this.activatedRoute.data.subscribe((data) => {
      this.headerService.updateButtonConfig({
        title: data['title'],
        action: data['action'],
        icon: data['icon'],
        route: '/categories/create',
      });
    });
    this.loadCategories();
  }

  private loadCategories() {
    this.#paramsSub
      .pipe(
        takeUntil(this.destroy$),
        tap(() => (this.isLoadingResults = true)),
        switchMap((params) =>
          this.categoryService
            .getCategories(params)
            .pipe(finalize(() => (this.isLoadingResults = false)))
        )
      )
      .subscribe((res) => {
        this._responseSub.next(res);
      });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.loadMoreCategories();
    ev.target.complete();
  }

  loadMoreCategories() {
    this.selectedPage++;
    this.categoryService
      .getCategories({ page: this.selectedPage, size: this.pageSize })
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Category[]) => {
        console.log('data', data)
      });
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
    ev.detail.complete();
  }

  filter(event: any) {
    const query = event.target.value.toLowerCase();
  }

  setOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }
}
