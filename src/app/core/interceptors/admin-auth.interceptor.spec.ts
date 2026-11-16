import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DefaultUrlSerializer, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminAuthInterceptor } from './admin-auth.interceptor';
import { AdminAuthService } from '../services/admin-auth.service';
import { API_BASE_URL } from '../config/api.config';

describe('Administrative session redirects', () => {
  const router = { url: '/', currentNavigation: signal<{ extractedUrl: UrlTree } | null>(null), navigate: vi.fn() };
  const auth = { clearSession: vi.fn(), authenticated: signal(true) };
  let http: HttpTestingController;

  beforeEach(() => {
    router.url = '/';
    router.currentNavigation.set(null);
    router.navigate.mockReset();
    auth.clearSession.mockReset();
    auth.authenticated.set(true);
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([adminAuthInterceptor])), provideHttpClientTesting(),
      { provide: Router, useValue: router }, { provide: AdminAuthService, useValue: auth },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function expireAdminRequest(): void {
    TestBed.inject(HttpClient).get(`${API_BASE_URL}/admin/products`).subscribe({ error: () => {} });
    http.expectOne(`${API_BASE_URL}/admin/products`).flush(null, { status: 401, statusText: 'Unauthorized' });
  }

  it('keeps a visitor on the customer site when an old admin request fails', () => {
    expireAdminRequest();
    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects an expired administrative session to the admin login', () => {
    router.url = '/admin/produtos';
    expireAdminRequest();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: { expired: '1' } });
  });

  it('does not interrupt navigation back to the customer site', () => {
    router.url = '/admin/produtos';
    router.currentNavigation.set({ extractedUrl: new DefaultUrlSerializer().parse('/') });
    expireAdminRequest();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not replace the password-changed navigation after the session closes', () => {
    router.url = '/admin/perfil';
    auth.authenticated.set(false);
    expireAdminRequest();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
