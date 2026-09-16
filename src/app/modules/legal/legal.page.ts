import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterLink],
  template: `<ion-header
      ><ion-toolbar
        ><ion-buttons slot="start"
          ><ion-back-button defaultHref="/auth/signup" /></ion-buttons
        ><ion-title>{{ titleKey | translate }}</ion-title></ion-toolbar
      ></ion-header
    ><ion-content class="ion-padding legal-content"
      ><article>
        <h1>{{ titleKey | translate }}</h1>
        <p class="last-updated">{{ 'LEGAL.LAST_UPDATED' | translate }}</p>
        @for (section of sections; track section.title) {
        <section>
          <h2>{{ section.title | translate }}</h2>
          @for (paragraph of section.body; track paragraph) {
          <p>{{ paragraph | translate }}</p>
          }
        </section>
        }
      </article></ion-content
    >`,
})
export class LegalPageComponent {
  titleKey = '';
  sections: { title: string; body: string[] }[] = [];
  constructor(route: ActivatedRoute) {
    const privacy = route.snapshot.routeConfig?.path === 'privacy';
    this.titleKey = privacy ? 'LEGAL.PRIVACY_TITLE' : 'LEGAL.TERMS_TITLE';
    this.sections = privacy
      ? [
          {
            title: 'LEGAL.PRIVACY_DATA_TITLE',
            body: ['LEGAL.PRIVACY_DATA_BODY', 'LEGAL.PRIVACY_ACCOUNT_BODY'],
          },
          {
            title: 'LEGAL.PRIVACY_STORAGE_TITLE',
            body: ['LEGAL.PRIVACY_STORAGE_BODY', 'LEGAL.PRIVACY_BACKUP_BODY'],
          },
          {
            title: 'LEGAL.PRIVACY_SERVICES_TITLE',
            body: [
              'LEGAL.PRIVACY_SERVICES_BODY',
              'LEGAL.PRIVACY_BIOMETRIC_BODY',
            ],
          },
          {
            title: 'LEGAL.PRIVACY_CONTROLS_TITLE',
            body: ['LEGAL.PRIVACY_CONTROLS_BODY', 'LEGAL.PRIVACY_CHANGES_BODY'],
          },
        ]
      : [
          {
            title: 'LEGAL.TERMS_SERVICE_TITLE',
            body: ['LEGAL.TERMS_SERVICE_BODY', 'LEGAL.TERMS_FINANCIAL_BODY'],
          },
          {
            title: 'LEGAL.TERMS_ACCOUNT_TITLE',
            body: ['LEGAL.TERMS_ACCOUNT_BODY', 'LEGAL.TERMS_SECURITY_BODY'],
          },
          {
            title: 'LEGAL.TERMS_OFFLINE_TITLE',
            body: ['LEGAL.TERMS_OFFLINE_BODY', 'LEGAL.TERMS_BACKUP_BODY'],
          },
          {
            title: 'LEGAL.TERMS_SERVICES_TITLE',
            body: ['LEGAL.TERMS_SERVICES_BODY', 'LEGAL.TERMS_CHANGES_BODY'],
          },
        ];
  }
}
