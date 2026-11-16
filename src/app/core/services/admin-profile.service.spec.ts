import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { AdminAuthService } from './admin-auth.service';
import { AdminProfileService } from './admin-profile.service';

describe('AdminProfileService account identity', () => {
  let service: AdminProfileService;
  let auth: AdminAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AdminAuthService);
    auth.user.set({ username: 'roni', role: 'ADMIN' });
    service = TestBed.inject(AdminProfileService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('shows the authenticated login when no profile exists', async () => {
    http.expectOne(`${API_BASE_URL}/admin/profile`).flush({}, { status: 404, statusText: 'Not Found' });
    await Promise.resolve();
    expect(service.profile()).toEqual({ name: 'roni', nickname: 'roni', photoUrl: null });
    expect(service.error()).toBe('');
  });

  it('shows the nickname from the account profile', async () => {
    http.expectOne(`${API_BASE_URL}/admin/profile`).flush({ fullName: 'Roni', nickname: 'Ron', photoUrl: null });
    await Promise.resolve();
    expect(service.profile().nickname).toBe('Ron');
  });

  it('discards the previous account profile when switching accounts', async () => {
    const previous = http.expectOne(`${API_BASE_URL}/admin/profile`);
    auth.user.set({ username: 'another-admin', role: 'ADMIN' });
    TestBed.tick();
    previous.flush({ fullName: 'Roni', nickname: 'Ron', photoUrl: null });
    http.expectOne(`${API_BASE_URL}/admin/profile`).flush({}, { status: 404, statusText: 'Not Found' });
    await Promise.resolve();
    expect(service.profile().nickname).toBe('another-admin');
    auth.clearSession();
    TestBed.tick();
    expect(service.profile().nickname).toBe('');
  });
});
