import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
      provideHttpClientTesting(),
    ] });
    service = TestBed.inject(AdminAuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); vi.useRealTimers(); });

  it('cancels a login request that does not respond and reports the timeout', async () => {
    vi.useFakeTimers();
    const login = service.login('admin', 'a password for testing');
    const rejected = expect(login).rejects.toThrow('A API demorou para responder');
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    const request = http.expectOne(`${API_BASE_URL}/auth/login`);
    vi.advanceTimersByTime(15_000);
    await rejected;
    expect(request.cancelled).toBe(true);
    expect(service.authenticated()).toBe(false);
  });

  it('allows a new session check after a previous one timed out', async () => {
    vi.useFakeTimers();
    const first = service.restoreSession();
    const request = http.expectOne(`${API_BASE_URL}/auth/me`);
    vi.advanceTimersByTime(15_000);
    expect(await first).toBe(false);
    expect(request.cancelled).toBe(true);
    const second = service.restoreSession();
    http.expectOne(`${API_BASE_URL}/auth/me`).flush({ username: 'admin', role: 'ADMIN' });
    expect(await second).toBe(true);
  });

  it('honors Retry-After and blocks another request until the cooldown ends', async () => {
    vi.useFakeTimers();
    const login = service.login('admin', 'wrong-password');
    const rejected = expect(login).rejects.toThrow('Limite de tentativas');
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    http.expectOne(`${API_BASE_URL}/auth/login`).flush(null, {
      status: 429, statusText: 'Too Many Requests', headers: { 'Retry-After': '900' },
    });
    await rejected;
    expect(service.loginRetrySeconds()).toBe(900);
    await expect(service.login('another-admin', 'another-password')).rejects.toThrow('Aguarde o tempo indicado');
    http.expectNone(`${API_BASE_URL}/csrf`);
    vi.advanceTimersByTime(60_000);
    expect(service.loginRetrySeconds()).toBe(840);
    vi.advanceTimersByTime(840_000);
    expect(service.loginRetrySeconds()).toBe(0);
  });

  it('restores the session from the server after a reload', async () => {
    const restored = service.restoreSession();
    http.expectOne(`${API_BASE_URL}/auth/me`).flush({ username: 'admin', role: 'ADMIN' });
    expect(await restored).toBe(true);
    expect(service.authenticated()).toBe(true);
    expect(service.user()?.username).toBe('admin');
  });

  it('logs in once with the password and refreshes CSRF after authentication', async () => {
    const login = service.login('admin', 'a long password for testing');
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    const request = http.expectOne(`${API_BASE_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(new URLSearchParams(request.request.body).get('password')).toBe('a long password for testing');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await Promise.resolve();
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    http.expectOne(`${API_BASE_URL}/auth/me`).flush({ username: 'admin', role: 'ADMIN' });
    await login;
    expect(service.authenticated()).toBe(true);
    expect(service.user()?.username).toBe('admin');
  });

  it('only clears local state after the server confirms logout', async () => {
    service.authenticated.set(true);
    const logout = service.logout();
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    const request = http.expectOne(`${API_BASE_URL}/auth/logout`);
    expect(service.authenticated()).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(service.authenticated()).toBe(false);
  });

  it('clears the session after a successful password change', async () => {
    service.authenticated.set(true);
    const change = service.changePassword('current long password', 'another long password');
    http.expectOne(`${API_BASE_URL}/csrf`).flush({});
    await Promise.resolve();
    const request = http.expectOne(`${API_BASE_URL}/auth/password`);
    expect(request.request.body).toEqual({ currentPassword: 'current long password', newPassword: 'another long password' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await change;
    expect(service.authenticated()).toBe(false);
  });
});
