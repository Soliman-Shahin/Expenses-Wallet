import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';

import { HelpRoutingModule } from './help-routing.module';
import { HelpPageComponent } from './pages/help.page';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        TranslateModule,
        SharedModule,
        HelpRoutingModule,
        HelpPageComponent
    ]
})
export class HelpModule { }
