import { Directive } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  PAGE_SIZE_OPTIONS,
  SORT_ORDER
} from 'src/app/core/constants';
import { BaseComponent } from './base.component';

@Directive()
export abstract class BasePagedResponse<T = any> extends BaseComponent {
  protected _responseSub = new BehaviorSubject<T | null>(null);
  response$ = this._responseSub.asObservable();
  pageSize = 10;
  sortOrder = SORT_ORDER;
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  sortBy = 'createdAt';
  selectedPage = 0;
  total = 0;
  itemsLength = 0;
  isLoadingResults = false;
  searchCategory: any = null;
}
