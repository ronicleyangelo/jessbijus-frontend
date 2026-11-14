import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiOrder } from '../api/api-models';
import { AdminOrder } from '../models/admin-order.model';
import { OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly api = inject(ApiClient);
  readonly orders = signal<AdminOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly recent = computed(() => [...this.orders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  constructor() { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const all: ApiOrder[] = [];
      let page = 0;
      let total = 0;
      do {
        const result = await firstValueFrom(this.api.orders(page, 100));
        all.push(...result.content);
        total = result.totalElements;
        page++;
      } while (all.length < total);
      this.orders.set(all.map(this.mapOrder));
    } catch {
      this.error.set('Não foi possível carregar os pedidos da API.');
    } finally {
      this.loading.set(false);
    }
  }

  async create(customerName: string, items: Array<{ productId: string; quantity: number }>, contact: string): Promise<AdminOrder> {
    const saved = this.mapOrder(await firstValueFrom(this.api.placeOrder(customerName, items, contact)));
    this.orders.update(current => [saved, ...current]);
    return saved;
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<void> {
    const saved = this.mapOrder(await firstValueFrom(this.api.changeOrderStatus(orderId, status)));
    this.orders.update(current => current.map(order => order.id === saved.id ? saved : order));
  }

  private mapOrder(order: ApiOrder): AdminOrder {
    return {
      id: order.id,
      code: `#JB-${order.id.slice(0, 8).toUpperCase()}`,
      customerName: order.customerName,
      contact: order.contact ?? '',
      itemsSummary: order.items.map(item => `${item.quantity} × ${item.productName}`).join(', '),
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,
    };
  }
}
