import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShopCatalogService } from '../../core/services/shop-catalog.service';
import { ShopCategory } from '../../core/models/shop-product.model';
import { ProductMedia } from '../../core/models/product-media.model';
import { ShopCartService } from '../../core/services/shop-cart.service';
import { ProductMediaService } from '../../core/services/product-media.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail-page',
  imports: [CurrencyPipe, RouterLink, ProductCardComponent],
  templateUrl: './product-detail.page.html',
  styleUrl: './product-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(ShopCartService);
  readonly catalog = inject(ShopCatalogService);
  private readonly mediaService = inject(ProductMediaService);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  readonly product = computed(() => this.catalog.activeProducts().find(item => item.id === this.params().get('id')));
  readonly gallery = computed<ProductMedia[]>(() => {
    const product = this.product();
    if (!product) return [];
    return [
      { id: 'main', type: 'image', url: product.imageUrl, alt: product.imageAlt },
      ...(this.mediaService.byProduct()[product.id] ?? []),
    ];
  });
  readonly selectedMediaIndex = signal(0);
  readonly selectedMedia = computed(() => this.gallery()[Math.min(this.selectedMediaIndex(), this.gallery().length - 1)]);
  readonly relatedProducts = computed(() => this.catalog.activeProducts().filter(item => item.id !== this.product()?.id).slice(0, 3));
  readonly quantity = signal(1);
  readonly zoomPosition = signal({ x: 50, y: 50 });
  readonly categoryLabels: Record<ShopCategory, string> = {
    brincos: 'Brincos',
    colares: 'Colares',
    pulseiras: 'Pulseiras',
    conjuntos: 'Conjuntos', aneis: 'Anéis',
  };

  selectMedia(index: number): void {
    this.selectedMediaIndex.set(index);
    this.zoomPosition.set({ x: 50, y: 50 });
  }

  moveZoom(event: MouseEvent): void {
    const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    if (!bounds) return;
    this.zoomPosition.set({
      x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
    });
  }

  decreaseQuantity(): void {
    this.quantity.update(value => Math.max(1, value - 1));
  }

  increaseQuantity(): void {
    this.quantity.update(value => Math.min(this.product()?.stockQuantity ?? 1, value + 1));
  }

  addToList(): void {
    const product = this.product();
    if (!product || product.stockQuantity < 1) return;
    const current = this.cart.items().find(item => item.product.id === product.id)?.quantity ?? 0;
    this.cart.setQuantity(product.id, current + this.quantity());
    void this.router.navigate(['/minha-lista']);
  }
}
