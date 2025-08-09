import { Component, inject, OnInit } from '@angular/core';
import {
  AlertController,
  InfiniteScrollCustomEvent,
  ItemReorderEventDetail,
  RefresherCustomEvent,
} from '@ionic/angular';
import { BehaviorSubject, finalize, switchMap, takeUntil, tap } from 'rxjs';
import { BaseListComponent } from 'src/app/shared/base';
import { Category, CategoryParams } from '../../models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent
  extends BaseListComponent<Category>
  implements OnInit
{
  private alertController = inject(AlertController);

  sizeOptions = {
    pageSizeOptions: this.pageSizeOptions,
    pageSize: this.pageSize,
  };

  sortOptions = {
    sortBy: 'createdAt',
  };

  readonly #defaultParams: CategoryParams = {
    skip: 0,
    limit: this.pageSize,
    sort: `-${this.sortOptions?.sortBy}`,
  };

  readonly #paramsSub = new BehaviorSubject<CategoryParams>({
    ...this.#defaultParams,
  });

  get activatedParams() {
    return this.#paramsSub.getValue();
  }

  isActionSheetOpen = false;
  selectedCategory: Category | null = null;

  constructor() {
    super();
  }

  override ngOnInit() {
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
      .subscribe((res: any) => {
        this._responseSub.next(res);
      });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.loadMoreCategories();
    setTimeout(() => {
      ev.target.complete();
    }, 500);
  }

  loadMoreCategories() {
    this.activatedParams.skip =
      this.activatedParams.skip + this.activatedParams.limit;
    this.#paramsSub.next({ ...this.activatedParams });
  }

  doRefresh(ev: RefresherCustomEvent) {
    // reset pagination and reload
    this.activatedParams.skip = 0;
    this.#paramsSub.next({ ...this.activatedParams });
    setTimeout(() => ev.target.complete(), 600);
  }

  navigateToAdd() {
    this.router.navigate(['/categories/create']);
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
    ev.detail.complete();
  }

  async presentActionSheet(category: Category) {
    this.selectedCategory = category;
    const actionSheet = await this.alertController.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteCategory(this.selectedCategory?.id as string);
          },
        },
        {
          text: 'Edit',
          handler: () => {
            this.router.navigate([
              '/categories/edit',
              this.selectedCategory?.id,
            ]);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  deleteCategory(id: string) {
    this.categoryService
      .deleteCategory(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const currentResponse = this._responseSub.getValue();
        if (currentResponse) {
          const filteredData = currentResponse.data.filter((c) => c.id !== id);
          this._responseSub.next({ ...currentResponse, data: filteredData });
        }
      });
  }

  filter(event: any) {
    const query = event.target.value.toLowerCase();
    this.activatedParams.q = query;
    this.#paramsSub.next({ ...this.activatedParams });
  }

  setOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }
}
