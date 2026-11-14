import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const header = inject(AdminAuthService).header();
  const adminPath = `${API_BASE_URL}/admin/`;
  return next(header && request.url.startsWith(adminPath) && !request.headers.has('Authorization')
    ? request.clone({ setHeaders: { Authorization: header } })
    : request);
};
