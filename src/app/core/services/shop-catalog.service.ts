import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiCategory, ApiProduct } from '../api/api-models';
import { ProductMedia } from '../models/product-media.model';
import { ShopCategory, ShopProduct } from '../models/shop-product.model';

const CATEGORY_NAMES: Record<ShopCategory, string> = {
  brincos: 'Brincos', colares: 'Colares', pulseiras: 'Pulseiras', conjuntos: 'Conjuntos',
};

@Injectable({ providedIn: 'root' })
export class ShopCatalogService {
  private readonly api = inject(ApiClient);
  readonly products = signal<ShopProduct[]>([]);
  readonly categories = signal<ApiCategory[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeProducts = computed(() => this.products().filter(product => product.active !== false));

  constructor() { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [categories, products] = await firstValueFrom(forkJoin([this.api.categories(), this.api.products(true)]));
      this.categories.set(categories);
      this.products.set(products.map(product => this.mapProduct(product, categories)));
    } catch {
      this.error.set('Não foi possível carregar o catálogo. Verifique a conexão com a API.');
    } finally {
      this.loading.set(false);
    }
  }

  find(productId: string): ShopProduct | undefined { return this.products().find(product => product.id === productId); }

  async save(product: ShopProduct): Promise<ShopProduct> {
    let category = this.categories().find(item => item.slug === product.category);
    if (!category) {
      category = await firstValueFrom(this.api.createCategory(CATEGORY_NAMES[product.category], product.category));
      this.categories.update(items => [...items, category!]);
    }
    const images = [
      { url: product.imageUrl, altText: product.imageAlt, displayOrder: 0, type: 'image' as const },
      ...(product.media ?? []).map((item, index) => ({ url: item.url, altText: item.alt, displayOrder: index + 1, type: item.type })),
    ];
    const existing = this.find(product.id);
    const saved = await firstValueFrom(this.api.saveProduct({
      categoryId: category.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      active: product.active !== false,
      bestSeller: !!product.isBestSeller,
      badge: product.badge ?? null,
      images,
    }, existing?.id));
    if (saved.badge !== (product.badge ?? null) || saved.bestSeller !== !!product.isBestSeller) {
      throw new Error('A API em execução não salvou o destaque. Reinicie o backend com o código atualizado.');
    }
    const mapped = this.mapProduct(saved, this.categories());
    this.products.update(items => existing ? items.map(item => item.id === mapped.id ? mapped : item) : [mapped, ...items]);
    return mapped;
  }

  private mapProduct(product: ApiProduct, categories: ApiCategory[]): ShopProduct {
    const images = [...product.images].sort((a, b) => a.displayOrder - b.displayOrder);
    const main = images.find(image => image.type !== 'video');
    const category = categories.find(item => item.id === product.categoryId)?.slug;
    const media: ProductMedia[] = images.filter(image => image !== main).map(image => ({
      id: image.id,
      type: image.type === 'video' ? 'video' : 'image',
      url: image.url,
      alt: image.altText ?? product.name,
    }));
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      stockQuantity: product.stockQuantity,
      active: product.active,
      isBestSeller: product.bestSeller || product.badge === 'MAIS VENDIDO',
      badge: product.badge ?? (product.bestSeller ? 'MAIS VENDIDO' : undefined),
      category: category === 'brincos' || category === 'colares' || category === 'pulseiras' || category === 'conjuntos' ? category : 'brincos',
      imageUrl: main?.url ?? '/images/jessbijus-logo.svg',
      imageAlt: main?.altText ?? product.name,
      isNew: product.badge === 'NOVO',
      media,
    };
  }
}
