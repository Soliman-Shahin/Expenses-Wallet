import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsListComponent } from './components/transactions-list/transactions-list.component';
import { APP_ROUTES } from 'src/app/core/constants';

const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.TRANSACTIONS.LIST,
    pathMatch: 'full',
  },
  {
    path: APP_ROUTES.TRANSACTIONS.LIST,
    component: TransactionsListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransactionsRoutingModule { }
