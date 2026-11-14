import { computed, inject, Injectable, signal } from '@angular/core';
import { ShopProduct } from '../models/shop-product.model';
import { ShopCatalogService } from './shop-catalog.service';

interface StoredCartItem {
  productId: string;
  quantity: number;
}

export interface CartItem {
  product: ShopProduct;
  quantity: number;
  subtotal: number;
}

const STORAGE_KEY = 'jessbijus:minha-lista';

@Injectable({ providedIn: 'root' })
export class ShopCartService {
  private readonly catalog = inject(ShopCatalogService);
  private readonly entries = signal<StoredCartItem[]>(this.readStoredItems());
  readonly items = computed<CartItem[]>(() =>
    this.entries().flatMap(entry => {
      const product = this.catalog.products().find(item => item.id === entry.productId);
      return product && product.active !== false && product.stockQuantity > 0 ? [{ product, quantity: Math.min(entry.quantity, product.stockQuantity), subtotal: product.price * Math.min(entry.quantity, product.stockQuantity) }] : [];
    }),
  );
  readonly itemCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly total = computed(() => this.items().reduce((sum, item) => sum + item.subtotal, 0));

  add(product: ShopProduct): void {
    const current = this.entries().find(item => item.productId === product.id);
    this.setQuantity(product.id, (current?.quantity ?? 0) + 1);
  }

  setQuantity(productId: string, quantity: number): void {
    const product = this.catalog.find(productId);
    if (!product) return;
    const next = this.entries().filter(item => item.productId !== productId);
    if (quantity > 0) next.push({ productId, quantity: Math.min(Math.floor(quantity), product.stockQuantity) });
    this.update(next);
  }

  remove(productId: string): void {
    this.update(this.entries().filter(item => item.productId !== productId));
  }

  private update(items: StoredCartItem[]): void {
    this.entries.set(items);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private readStoredItems(): StoredCartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [];
      return value.flatMap(item => {
        if (!item || typeof item.productId !== 'string' || !Number.isInteger(item.quantity)) return [];
        return item.quantity > 0 ? [{ productId: item.productId, quantity: item.quantity }] : [];
      });
    } catch {
      return [];
    }
  }
}
