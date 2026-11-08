import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgxMask } from 'ngx-mask';
import { httpInterceptor } from '@shared/interceptors/http-interceptor';
import { errorInterceptor } from '@shared/interceptors/error-interceptor';

registerLocaleData(localeTr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([httpInterceptor , errorInterceptor])),
    provideNgxMask(),
    {provide: LOCALE_ID, useValue: 'tr'}
  ],
};
