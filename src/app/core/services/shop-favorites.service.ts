import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'jessbijus:favoritos';

@Injectable({ providedIn: 'root' })
export class ShopFavoritesService {
  readonly ids = signal<ReadonlySet<string>>(this.readStoredIds());

  has(productId: string): boolean {
    return this.ids().has(productId);
  }

  toggle(productId: string): void {
    const next = new Set(this.ids());
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    this.ids.set(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }

  private readStoredIds(): ReadonlySet<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
