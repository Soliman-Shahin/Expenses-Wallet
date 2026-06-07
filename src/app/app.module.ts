import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { IonicModule } from '@ionic/angular';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';
import { SharedModule } from './shared/shared.module';
import { AuthInterceptor } from './modules/auth/helper/authInterceptor';
// Import new interceptors
import { EncryptionAdvancedInterceptor } from './core/interceptors/encryption.interceptor';
import { ErrorInterceptor as EnhancedErrorInterceptor } from './core/interceptors/error.interceptor';
import { RetryInterceptor } from './core/interceptors/retry.interceptor';
import { CacheInterceptor } from './core/interceptors/cache.interceptor';
import { GlobalErrorHandler } from './core/services/global-error-handler.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    IonicModule.forRoot({
      mode: 'ios'
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    SharedModule,
    CoreModule,
    LayoutModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    // Global Error Handler
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
    // Interceptor order matters! They execute top to bottom for requests, bottom to top for responses
    // 1. Retry - First to catch and retry failed requests
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RetryInterceptor,
      multi: true,
    },
    // 2. Encryption - Encrypt/decrypt before auth
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EncryptionAdvancedInterceptor,
      multi: true,
    },
    // 3. Auth - Add auth tokens
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    // 4. Cache - Cache responses
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true,
    },
    // 5. Error - Last to handle all errors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EnhancedErrorInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
