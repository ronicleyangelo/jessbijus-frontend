import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
import { ApiCategory, ApiOrder, ApiPage, ApiProduct, ApiProductRequest, ApiProfile } from './api-models';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  health() {
    return this.http.get<{ status: string }>(`${API_BASE_URL}/health`);
  }

  categories() { return this.http.get<ApiCategory[]>(`${API_BASE_URL}/categories`); }
  createCategory(name: string, slug: string) { return this.http.post<ApiCategory>(`${API_BASE_URL}/admin/categories`, { name, slug }); }
  products(admin = false) { return this.http.get<ApiProduct[]>(`${API_BASE_URL}/${admin ? 'admin/' : ''}products`); }
  saveProduct(product: ApiProductRequest, id?: string) {
    return id
      ? this.http.put<ApiProduct>(`${API_BASE_URL}/admin/products/${id}`, product)
      : this.http.post<ApiProduct>(`${API_BASE_URL}/admin/products`, product);
  }
  placeOrder(customerName: string, items: Array<{ productId: string; quantity: number }>, contact?: string) {
    return this.http.post<ApiOrder>(`${API_BASE_URL}/orders`, { customerName, contact: contact || null, items });
  }
  orders(page = 0, size = 100) { return this.http.get<ApiPage<ApiOrder>>(`${API_BASE_URL}/admin/orders`, { params: { page, size } }); }
  changeOrderStatus(id: string, status: ApiOrder['status']) {
    return this.http.patch<ApiOrder>(`${API_BASE_URL}/admin/orders/${id}/status`, { status });
  }
  profile() { return this.http.get<ApiProfile>(`${API_BASE_URL}/admin/profile`); }
  saveProfile(fullName: string, nickname: string, photoUrl: string | null) {
    return this.http.put<ApiProfile>(`${API_BASE_URL}/admin/profile`, { fullName, nickname, photoUrl });
  }
}
