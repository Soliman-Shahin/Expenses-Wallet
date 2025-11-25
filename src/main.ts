import { enableProdMode } from '@angular/core';
import { initWebVitalsTracking } from './app/web-vitals';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Start Web Vitals tracking
initWebVitalsTracking();

// Register Arabic locale data for DatePipe month/day names
registerLocaleData(localeAr);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
