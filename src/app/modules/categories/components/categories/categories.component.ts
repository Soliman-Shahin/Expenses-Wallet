import { Component, inject, OnInit } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  ItemReorderEventDetail,
} from '@ionic/angular';
import { BehaviorSubject, map, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/shared/base';
import { Category } from '../../models';
import { CategoriesService } from '../../services';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent extends BaseComponent implements OnInit {
  private categoryService = inject(CategoriesService);

  categories$ = new BehaviorSubject<Category[]>([]);
  pageSize = 10;
  currentPage = 0;
  totalItems = 0;

  get categories() {
    return this.categories$.value;
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
    this.fetchAllCategories();
  }

  fetchAllCategories() {
    this.categoryService
      .getCategories()
      .pipe(
        takeUntil(this.destroy$),
        map((response: any) => {
          this.totalItems = response.total;
          return response.data;
        })
      )
      .subscribe((data: Category[]) => {
        this.categories$.next(data);
      });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.loadMoreCategories();
    ev.target.complete();
  }

  loadMoreCategories() {
    this.currentPage++;
    this.categoryService
      .getCategories({ page: this.currentPage, size: this.pageSize })
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Category[]) => {
        this.categories$.next([...this.categories, ...data]);
      });
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
    ev.detail.complete();
  }

  handleInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.categories$.next(
      this.categories.filter((d: any) => d.toLowerCase().indexOf(query) > -1)
    );
  }

  setOpen(isOpen: boolean) {
    this.isActionSheetOpen = isOpen;
  }
}
