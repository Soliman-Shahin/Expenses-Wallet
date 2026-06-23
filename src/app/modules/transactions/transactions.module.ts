import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AddFabButtonComponent } from 'src/app/shared/ui/add-fab-button/add-fab-button.component';

import { TransactionsRoutingModule } from './transactions-routing.module';
import { TransactionsListComponent } from './components/transactions-list/transactions-list.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        TranslateModule,
        SharedModule,
        AddFabButtonComponent,
        TransactionsRoutingModule
    ]
})
export class TransactionsModule { }
