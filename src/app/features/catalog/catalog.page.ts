import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SHOP_FILTERS, filterProducts, isShopFilter } from '../../core/data/shop-catalog';
import { ShopCatalogService } from '../../core/services/shop-catalog.service';
import { ShopFilter } from '../../core/models/shop-product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

const PAGE_SIZE = 8;

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly catalog = inject(ShopCatalogService);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  readonly filters = SHOP_FILTERS;
  readonly activeFilter = computed<ShopFilter>(() => {
    const value = this.params().get('categoria');
    return isShopFilter(value) ? value : 'todos';
  });
  readonly search = computed(() => this.params().get('busca')?.trim() ?? '');
  readonly products = computed(() => filterProducts(this.catalog.activeProducts(), this.activeFilter(), this.search()));
  readonly pageCount = computed(() => Math.ceil(this.products().length / PAGE_SIZE));
  readonly page = computed(() => {
    const requested = Number(this.params().get('pagina') ?? 1);
    return Number.isInteger(requested) && requested > 0 ? Math.min(requested, Math.max(1, this.pageCount())) : 1;
  });
  readonly visibleProducts = computed(() => this.products().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE));
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index + 1));
  readonly title = computed(() => this.filters.find(filter => filter.slug === this.activeFilter())?.label ?? 'Coleção Jessbijus');

  searchProducts(event: Event, value: string): void {
    event.preventDefault();
    void this.router.navigate(['/colecao'], {
      queryParams: {
        categoria: null,
        busca: value.trim() || null,
      },
    });
  }

  filterQueryParams(filter: ShopFilter): Record<string, string | null> {
    return { categoria: filter === 'todos' ? null : filter, busca: this.search() || null };
  }

  pageQueryParams(page: number): Record<string, string | number | null> {
    return {
      categoria: this.activeFilter() === 'todos' ? null : this.activeFilter(),
      busca: this.search() || null,
      pagina: page === 1 ? null : page,
    };
  }
}
