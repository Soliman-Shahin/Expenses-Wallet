import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseComponent } from 'src/app/shared/base/base.component';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-help-page',
    templateUrl: './help.page.html',
    styleUrls: ['./help.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [IonicModule, TranslateModule]
})
export class HelpPageComponent extends BaseComponent {
  
  faqs = [
    {
      question: 'HELP_PAGE.FAQ_1_Q',
      answer: 'HELP_PAGE.FAQ_1_A'
    },
    {
      question: 'HELP_PAGE.FAQ_2_Q',
      answer: 'HELP_PAGE.FAQ_2_A'
    },
    {
      question: 'HELP_PAGE.FAQ_3_Q',
      answer: 'HELP_PAGE.FAQ_3_A'
    }
  ];

  openEmail() {
    window.location.href = 'mailto:support@expenses-wallet.com';
  }

  openWhatsApp() {
    window.open('https://wa.me/201234567890', '_blank');
  }

  openWebsite() {
    window.open('https://expenses-wallet.com', '_blank');
  }
}
