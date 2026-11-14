import { registerLocaleData } from '@angular/common';
import ptBr from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { jessbijusTheme } from './core/config/theme.config';
import { adminAuthInterceptor } from './core/interceptors/admin-auth.interceptor';

registerLocaleData(ptBr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideHttpClient(withInterceptors([adminAuthInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    MessageService,
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: jessbijusTheme,
        options: { darkModeSelector: false },
      },
    })
  ]
};
