import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { ADMIN_CATALOG, ShopCatalogService } from './shop-catalog.service';
import { API_BASE_URL } from '../config/api.config';

describe('Catalog access', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads the customer catalog without making an administrative request', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const catalog = TestBed.inject(ShopCatalogService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API_BASE_URL}/categories`).flush([]);
    http.expectOne(`${API_BASE_URL}/products`).flush([]);
    http.expectNone(`${API_BASE_URL}/admin/products`);
    await Promise.resolve();
    expect(catalog.error()).toBe('');
    expect(catalog.loading()).toBe(false);
  });

  it('loads administrative products only when the admin scope is explicitly provided', async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: ADMIN_CATALOG, useValue: true },
    ] });
    const catalog = TestBed.inject(ShopCatalogService);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API_BASE_URL}/categories`).flush([]);
    http.expectOne(`${API_BASE_URL}/admin/products`).flush([]);
    http.expectNone(`${API_BASE_URL}/products`);
    await Promise.resolve();
    expect(catalog.error()).toBe('');
  });
});
