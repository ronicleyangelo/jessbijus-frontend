import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faCartShopping, faInstagram, faMagnifyingGlass, faWhatsapp, faXmark } from '../../shared/icons';
import { BrandComponent } from '../../shared/components/brand/brand.component';
import { ShopCartService } from '../services/shop-cart.service';
import { isShopFilter } from '../data/shop-catalog';

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
    void this.router.navigate(['/colecao'], { queryParams: { busca: value.trim() || null } });
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
