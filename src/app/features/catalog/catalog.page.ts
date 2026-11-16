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

  readonly groups = computed(() => [{key: null, label: 'Todos os conjuntos'}, ...this.catalog.subcategories().map(item => ({key: item.slug, label: item.name}))]);
  readonly filters = SHOP_FILTERS;
  readonly activeFilter = computed<ShopFilter>(() => {
    const value = this.params().get('categoria');
    return isShopFilter(value) ? value : 'todos';
  });
  readonly search = computed(() => this.params().get('busca')?.trim() ?? '');
  readonly subcategory = computed(() => {
    const value = this.params().get('subcategoria');
    return this.activeFilter() === 'conjuntos' && this.catalog.subcategories().some(group => group.slug === value) ? value : null;
  });
  readonly products = computed(() => {
    const products = filterProducts(this.catalog.activeProducts(), this.activeFilter(), this.search());
    const group = this.subcategory();
    const name = this.catalog.subcategories().find(item => item.slug === group)?.name;
    return name ? products.filter(product => product.subcategories?.includes(name)) : products;
  });
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
      subcategoria: this.subcategory(),
      pagina: page === 1 ? null : page,
    };
  }
}
