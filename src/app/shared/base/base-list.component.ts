import { Directive } from '@angular/core';
import { PagingResponse } from '../models';
import { BasePagedResponse } from './base-paged-response.component';

@Directive()
export abstract class BaseListComponent<
  TResponse = any
> extends BasePagedResponse<PagingResponse<TResponse>> {}
