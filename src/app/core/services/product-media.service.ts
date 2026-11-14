import { computed, inject, Injectable } from '@angular/core';
import { ProductMedia } from '../models/product-media.model';
import { ShopCatalogService } from './shop-catalog.service';

@Injectable({ providedIn: 'root' })
export class ProductMediaService {
  private readonly catalog = inject(ShopCatalogService);
  readonly byProduct = computed<Record<string, ProductMedia[]>>(() => Object.fromEntries(
    this.catalog.products().map(product => [product.id, product.media ?? []]),
  ));
}
