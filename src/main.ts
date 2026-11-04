import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Locale argentino: separadores de miles y moneda en formato local.
registerLocaleData(localeEsAr);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
