import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import {
  AlertController,
  InfiniteScrollCustomEvent,
  ItemReorderEventDetail,
  RefresherCustomEvent,
} from '@ionic/angular';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { BaseListComponent } from 'src/app/shared/base';
import { Category, CategoryParams } from '../../models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent
  extends BaseListComponent<Category>
  implements OnInit
{
  private alertController = inject(AlertController);
  private translate = inject(TranslateService);

  private readonly loading = new BehaviorSubject<boolean>(false);
  private readonly errorMessage = new BehaviorSubject<string>('');

  readonly vm$ = combineLatest({
    response: this.response$,
    isLoading: this.loading.asObservable(),
    errorMessage: this.errorMessage.asObservable(),
  });

  sizeOptions = {
    pageSizeOptions: this.pageSizeOptions,
    pageSize: this.pageSize,
  };

  sortOptions = {
    sortBy: 'order',
  };

  readonly #defaultParams: CategoryParams = {
    skip: 0,
    limit: this.pageSize,
    sort: this.sortOptions?.sortBy as string,
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

  override ngOnInit() {}

  ionViewWillEnter() {
    this.loadCategories();
  }

  private loadCategories() {
    this.#paramsSub
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.loading.next(true);
          this.errorMessage.next('');
        }),
        switchMap((params) =>
          this.categoryService.getCategories(params, true).pipe( // forceRefresh = true
            finalize(() => this.loading.next(false)),
            catchError((err) => {
              this.errorMessage.next(err.message);
              return of(null);
            })
          )
        )
      )
      .subscribe((res: any) => {
        if (res) {
          const currentResponse = this._responseSub.getValue();
          const params = this.#paramsSub.getValue();
          // If it's the first page (or a filter was applied), replace the data
          if (params.skip === 0 || !currentResponse) {
            this._responseSub.next(res);
          } else {
            // Otherwise, append the new data for infinite scroll
            this._responseSub.next({
              ...currentResponse, // Keep current response metadata (like total)
              data: [...currentResponse.data, ...res.data], // Merge only the data arrays
            });
          }
        }
      });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.loadMoreCategories();
    setTimeout(() => {
      ev.target.complete();
    }, 500);
  }

  loadMoreCategories() {
    if (this.loading.getValue()) return; // Prevent multiple requests

    const currentParams = this.#paramsSub.getValue();
    const nextParams = {
      ...currentParams,
      skip: currentParams.skip + currentParams.limit,
    };
    this.#paramsSub.next(nextParams);
  }

  doRefresh(ev: RefresherCustomEvent) {
    // Reset pagination and filters to their default state
    this.#paramsSub.next(this.#defaultParams);
    setTimeout(() => ev.target.complete(), 600);
  }

  navigateToAdd() {
    this.router.navigate(['/categories/create']);
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    const currentResponse = this._responseSub.getValue();
    if (currentResponse) {
      const movedItem = currentResponse.data.splice(ev.detail.from, 1)[0];
      currentResponse.data.splice(ev.detail.to, 0, movedItem);
      // Use 'categoryId' instead of 'id' to avoid the HTTP encryption interceptor
      // from double-encrypting the MongoDB ObjectId (interceptor encrypts fields
      // named 'id' and '_id', causing a key mismatch error on the backend)
      const reorderedCategories = currentResponse.data.map(
        (category, index) => ({
          categoryId: category._id as string,
          order: index,
        })
      );
      this.categoryService.updateOrder(reorderedCategories).subscribe();
      this._responseSub.next({ ...currentResponse });
    }
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
            this.presentDeleteConfirm(this.selectedCategory?._id as string);
          },
        },
        {
          text: 'Edit',
          handler: () => {
            this.router.navigate([
              '/categories/edit',
              this.selectedCategory?._id,
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

  async presentDeleteConfirm(id: string) {
    const categoryName = this.selectedCategory?.title || '';
    await this.alertService.showDeleteConfirm(categoryName, async () => {
      this.deleteCategory(id);
    });
  }

  deleteCategory(id: string) {
    this.loading.next(true);
    this.errorMessage.next('');
    this.categoryService
      .deleteCategory(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.next(false)),
        catchError((err) => {
          this.errorMessage.next(err.message);
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result !== null) {
          const currentResponse = this._responseSub.getValue();
          if (currentResponse) {
            const filteredData = currentResponse.data.filter(
              (c) => c._id !== id
            );
            const newTotal = currentResponse.total - 1;
            this._responseSub.next({
              ...currentResponse,
              data: filteredData,
              total: newTotal,
            });
            this.toastService.presentSuccessToast(
              'bottom',
              this.translateService.instant('CATEGORY.SUCCESSFULLY_DELETED')
            );
          }
        }
      });
  }

  filter(event: any) {
    const query = event.target.value.toLowerCase();
    const currentParams = this.#paramsSub.getValue();
    this.#paramsSub.next({
      ...currentParams,
      skip: 0,
      q: query,
    });
  }

  filterByType(event: any) {
    const type = event.detail.value;
    const currentParams = this.#paramsSub.getValue();
    this.#paramsSub.next({
      ...currentParams,
      skip: 0,
      type: type === 'all' ? undefined : type,
    });
  }

  setOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }
}
