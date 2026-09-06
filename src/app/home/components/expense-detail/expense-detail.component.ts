import { expenseSyncLabel } from 'src/app/shared/utils/expense-presentation';

import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Expense } from 'src/app/shared/models/expense.model';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-header class="ion-no-border"
      ><ion-toolbar>
        <ion-title>{{ 'MOBILE.RECORD' | translate }}</ion-title>
        <ion-buttons slot="end"
          ><ion-button
            (click)="close()"
            [attr.aria-label]="'COMMON.CLOSE' | translate"
            ><ion-icon
              slot="icon-only"
              name="close-outline"
            ></ion-icon></ion-button
        ></ion-buttons> </ion-toolbar
    ></ion-header>
    <ion-content>
      <article [dir]="locale === 'ar' ? 'rtl' : 'ltr'">
        <p class="eyebrow">{{ 'EXPENSE.DETAILS' | translate }}</p>
        <h1 dir="auto">{{ expense.description }}</h1>
        <p class="record-amount" dir="ltr">
          {{ expense.amount | number : '1.2-2' : locale }}
          <span>{{
            currency || ('MOBILE.CURRENCY_UNAVAILABLE' | translate)
          }}</span>
        </p>
        @if (syncLabel(expense); as status) {
        <p class="record-status" role="status">{{ status | translate }}</p>
        }
        <dl>
          <div>
            <dt>{{ 'EXPENSE.CATEGORY' | translate }}</dt>
            <dd dir="auto">{{ categoryName }}</dd>
          </div>
          <div>
            <dt>{{ 'EXPENSE.DATE' | translate }}</dt>
            <dd>{{ expense.date | date : 'medium' : undefined : locale }}</dd>
          </div>
        </dl>
      </article>
    </ion-content>
    <ion-footer class="ion-no-border"
      ><ion-toolbar
        ><ion-button expand="block" (click)="edit()">{{
          'MOBILE.EDIT' | translate
        }}</ion-button></ion-toolbar
      ></ion-footer
    >
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      ion-toolbar {
        --background: var(--ion-item-background);
        --color: var(--ion-text-color);
      }
      ion-title {
        font-size: 18px;
      }
      article {
        padding: 24px 20px;
      }
      .eyebrow,
      dt {
        font-size: 13px;
        color: var(--ew-wallet-muted);
      }
      h1 {
        margin: 8px 0 16px;
        font-size: 22px;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }
      .record-amount {
        font-size: clamp(26px, 7vw, 36px);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        unicode-bidi: isolate;
        margin: 0 0 24px;
        overflow-wrap: anywhere;
      }
      .record-amount span {
        font-size: 16px;
        font-weight: 500;
        color: var(--ew-wallet-muted);
      }
      dl {
        margin: 0;
        border-top: 1px solid var(--ew-wallet-line);
      }
      dl div {
        display: grid;
        grid-template-columns: minmax(72px, 1fr) minmax(0, 2fr);
        gap: 16px;
        padding-block: 16px;
        border-bottom: 1px solid var(--ew-wallet-line);
      }
      dd {
        margin: 0;
        text-align: end;
        overflow-wrap: anywhere;
        line-height: 1.5;
      }
      ion-footer {
        padding: 8px 16px max(12px, env(safe-area-inset-bottom));
        background: var(--ion-item-background);
      }
      ion-button {
        min-height: 48px;
      }
    `,
  ],
})
export class ExpenseDetailComponent {
  readonly syncLabel = expenseSyncLabel;
  @Input({ required: true }) expense!: Expense;
  @Input() currency = '';
  @Input() categoryName = '—';
  @Input() locale = 'en';
  private readonly modal = inject(ModalController);
  close() {
    return this.modal.dismiss();
  }
  edit() {
    return this.modal.dismiss(null, 'edit');
  }
}
