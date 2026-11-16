import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faCartShopping, faInstagram, faMagnifyingGlass, faWhatsapp, faXmark } from '../../shared/icons';
import { BrandComponent } from '../../shared/components/brand/brand.component';
import { ShopCartService } from '../services/shop-cart.service';
import { filterProducts, isShopFilter } from '../data/shop-catalog';
import { ShopCatalogService } from '../services/shop-catalog.service';

@Component({
  selector: 'app-store-layout-page',
  imports: [RouterLink, RouterOutlet, FaIconComponent, BrandComponent],
  templateUrl: './store-layout.page.html',
  styleUrl: './store-layout.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreLayoutPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly cart = inject(ShopCartService);
  readonly catalog = inject(ShopCatalogService);
  readonly searchText = signal('');
  readonly searchFocused = signal(false);
  readonly suggestions = computed(() => this.searchText().trim()
    ? filterProducts(this.catalog.activeProducts(), 'todos', this.searchText()).slice(0, 5)
    : []);
  readonly activeCategory = computed(() => {
    const value = this.params().get('categoria');
    return isShopFilter(value) ? value : 'todos';
  });
  readonly activeSearch = computed(() => this.params().get('busca') ?? '');
  readonly menuOpen = signal(false);
  readonly menuIcon = faBars;
  readonly closeIcon = faXmark;
  readonly cartIcon = faCartShopping;
  readonly searchIcon = faMagnifyingGlass;
  readonly whatsappIcon = faWhatsapp;
  readonly instagramIcon = faInstagram;

  searchProducts(event: Event, value: string): void {
    event.preventDefault();
    this.searchFocused.set(false);
    void this.router.navigate(['/colecao'], { queryParams: { busca: value.trim() || null } });
  }

  closeSuggestions(): void { this.searchFocused.set(false); }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
