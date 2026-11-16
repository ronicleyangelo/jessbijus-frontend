import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  return next(request).pipe(catchError((error: unknown) => {
    const protectedRequest = request.url.startsWith(`${API_BASE_URL}/admin/`);
    if (protectedRequest && error instanceof HttpErrorResponse && error.status === 401) {
      const wasAuthenticated = auth.authenticated();
      auth.clearSession();
      const navigation = router.currentNavigation();
      const path = (navigation?.finalUrl || navigation?.extractedUrl)?.toString() || router.url;
      if (wasAuthenticated && /^\/admin(?:\/|$)/.test(path) && !/^\/admin\/login(?:[?#]|$)/.test(path)) {
        void router.navigate(['/admin/login'], { queryParams: { expired: '1' } });
      }
    }
    return throwError(() => error);
  }));
};
