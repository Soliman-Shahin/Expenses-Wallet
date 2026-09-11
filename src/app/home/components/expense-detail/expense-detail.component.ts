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
    <ion-header class="ion-no-border" [dir]="locale === 'ar' ? 'rtl' : 'ltr'"
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
    <ion-content [dir]="locale === 'ar' ? 'rtl' : 'ltr'">
      <article [dir]="locale === 'ar' ? 'rtl' : 'ltr'">
        <section class="record-hero">
          <div class="record-identity">
            <div
              class="record-icon"
              [style.--category-accent]="
                categoryVisual?.color || 'var(--ion-color-primary)'
              "
            >
              <ion-icon
                [name]="categoryVisual?.icon || 'receipt-outline'"
                aria-hidden="true"
              ></ion-icon>
            </div>
            <div class="identity-copy">
              <p class="eyebrow">
                <bdi>{{
                  categoryName || ('EXPENSE.CATEGORY' | translate)
                }}</bdi>
              </p>
              <h1 dir="auto">{{ expense.description }}</h1>
            </div>
          </div>
          <p class="amount-caption">{{ 'EXPENSE.AMOUNT' | translate }}</p>
          <p class="record-amount" dir="ltr">
            <bdi
              [class.income-amount]="isIncome"
              [class.outcome-amount]="!isIncome"
            >
              {{ isIncome ? '+' : '-'
              }}{{ absoluteAmount | number : '1.2-2' : locale }}
            </bdi>
            <bdi class="record-currency">{{
              currency || ('MOBILE.CURRENCY_UNAVAILABLE' | translate)
            }}</bdi>
          </p>
          <div
            class="record-type"
            [class.income]="isIncome"
            [class.outcome]="!isIncome"
          >
            <ion-icon
              [name]="
                isIncome ? 'trending-down-outline' : 'trending-up-outline'
              "
              aria-hidden="true"
            ></ion-icon>
            <span>{{
              (isIncome ? 'COMMON.INCOME' : 'COMMON.OUTCOME') | translate
            }}</span>
          </div>
          <section class="record-context">
            <div class="record-date">
              <ion-icon name="calendar-outline" aria-hidden="true"></ion-icon>
              <div>
                <p class="eyebrow">{{ 'EXPENSE.DATE' | translate }}</p>
                <p class="date-value">
                  <bdi>{{
                    isValidDate
                      ? (expense.date | date : 'medium' : undefined : locale)
                      : ('EXPENSE.DATE' | translate)
                  }}</bdi>
                </p>
              </div>
            </div>
          </section>
          @if (syncLabel(expense); as status) {
          <p class="record-status" role="status">{{ status | translate }}</p>
          }
        </section>
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
      ion-content {
        --background: var(--ion-background-color);
      }
      ion-toolbar {
        --background: var(--ion-background-color);
        --color: var(--ion-text-color);
      }
      ion-title {
        font-size: 16px;
        font-weight: 600;
        text-align: start;
        padding-inline-start: 1.5rem;
      }
      article {
        padding: 4px 20px 20px;
      }
      .record-hero {
        padding: 20px;
        border-radius: 20px 20px 20px 6px;
        background: var(--ion-item-background);
        box-shadow: var(--ew-bold-shadow);
        border: 1px solid var(--ew-wallet-line);
      }
      [dir='rtl'] .record-hero {
        border-radius: 20px 20px 6px 20px;
      }
      .record-identity {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      .record-icon {
        display: grid;
        place-items: center;
        flex: 0 0 44px;
        height: 48px;
        border-radius: 13px 13px 13px 5px;
        background: color-mix(
          in srgb,
          var(--category-accent) 14%,
          var(--ion-item-background)
        );
        color: var(--ion-text-color);
        border-inline-start: 3px solid var(--category-accent);
      }
      .record-icon ion-icon {
        font-size: 24px;
      }
      .identity-copy {
        min-width: 0;
      }
      .eyebrow,
      .amount-caption {
        margin: 0 0 5px;
        color: var(--ew-wallet-muted);
        font-size: 12px;
        font-weight: 400;
      }
      .identity-copy .eyebrow {
        font-weight: 500;
        overflow-wrap: anywhere;
      }
      h1 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        line-height: 1.4;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .amount-caption {
        margin-top: 24px;
      }
      .record-amount {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 6px 10px;
        margin: 0;
        font-size: clamp(36px, 11vw, 44px);
        line-height: 1.2;
        font-weight: 700;
        letter-spacing: -1px;
        font-variant-numeric: tabular-nums;
        unicode-bidi: isolate;
        overflow-wrap: anywhere;
        color: var(--ion-text-color);
      }
      .record-amount bdi {
        min-width: 0;
        max-width: 100%;
      }
      .record-amount .income-amount {
        color: var(--ion-color-success);
      }
      .record-amount .outcome-amount {
        color: var(--ion-color-danger);
      }
      .record-currency {
        color: var(--ew-wallet-muted);
        font-size: 14px;
        letter-spacing: 0;
        font-weight: 500;
      }
      .record-type {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 5px 9px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 650;
        background: var(--ew-wallet-inset);
        color: var(--ew-wallet-muted);
      }
      .record-type.income {
        color: var(--ion-color-success);
      }
      .record-type.outcome {
        color: var(--ion-color-danger);
      }
      .record-status {
        margin: 12px 0 0;
        color: var(--ew-wallet-muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .record-context {
        padding-top: 20px;
      }
      .record-date {
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }
      .record-date > ion-icon {
        margin-top: 2px;
        font-size: 16px;
        color: var(--ew-wallet-muted);
        flex-shrink: 0;
      }
      .record-date > div {
        min-width: 0;
      }
      .date-value {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      ion-footer {
        padding: 8px 20px max(12px, env(safe-area-inset-bottom));
        background: var(--ion-background-color);
      }
      ion-button {
        min-height: 48px;
      }
      ion-footer ion-button {
        margin: 0;
        --background: linear-gradient(110deg, #2855e8, #376aff);
        --color: #fff;
        font-weight: 600;
      }
      @media (max-width: 360px) {
        article {
          padding-inline: 16px;
        }
        .record-hero {
          padding: 16px;
        }
      }
    `,
  ],
})
export class ExpenseDetailComponent {
  readonly syncLabel = expenseSyncLabel;
  get categoryVisual() {
    return typeof this.expense.category === 'object'
      ? this.expense.category
      : null;
  }
  @Input({ required: true }) expense!: Expense;
  @Input() currency = '';
  @Input() categoryName = '';
  @Input() locale = 'en';
  private readonly modal = inject(ModalController);
  close() {
    return this.modal.dismiss();
  }
  edit() {
    return this.modal.dismiss(null, 'edit');
  }

  get isIncome(): boolean {
    const categoryType = this.categoryVisual?.type;
    return (
      categoryType === 'income' || (this.expense as any)?.type === 'income'
    );
  }

  get absoluteAmount(): number | null {
    const amount = Number(this.expense?.amount);
    return Number.isFinite(amount) ? Math.abs(amount) : null;
  }

  get isValidDate(): boolean {
    const timestamp = new Date(this.expense?.date).getTime();
    return Number.isFinite(timestamp);
  }
}
