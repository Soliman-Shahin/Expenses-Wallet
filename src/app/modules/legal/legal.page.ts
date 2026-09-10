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
        ><ion-title>{{ title }}</ion-title></ion-toolbar
      ></ion-header
    ><ion-content class="ion-padding legal-content"
      ><h1>{{ title }}</h1>
      <p>{{ intro }}</p>
      <h2>{{ 'LEGAL.DRAFT_LABEL' | translate }}</h2>
      <p>{{ 'LEGAL.DRAFT_BODY' | translate }}</p>
      <p>{{ 'LEGAL.REPLACEMENT_NOTE' | translate }}</p></ion-content
    >`,
})
export class LegalPageComponent {
  title = '';
  intro = '';
  constructor(route: ActivatedRoute) {
    const privacy = route.snapshot.routeConfig?.path === 'privacy';
    this.title = privacy ? 'Privacy Policy' : 'Terms & Conditions';
    this.intro = privacy ? 'Privacy Policy draft' : 'Terms & Conditions draft';
  }
}
