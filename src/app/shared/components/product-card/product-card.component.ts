import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ShopCartService } from '../../../core/services/shop-cart.service';
import { ShopFavoritesService } from '../../../core/services/shop-favorites.service';
import { ShopProduct } from '../../../core/models/shop-product.model';
import { faHeartRegular, faHeartSolid } from '../../icons';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, FaIconComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly cart = inject(ShopCartService);
  private readonly favorites = inject(ShopFavoritesService);
  private readonly router = inject(Router);

  readonly product = input.required<ShopProduct>();
  readonly heartRegular = faHeartRegular;
  readonly heartSolid = faHeartSolid;

  isFavorite(): boolean {
    return this.favorites.has(this.product().id);
  }

  toggleFavorite(): void {
    this.favorites.toggle(this.product().id);
  }

  addToList(): void {
    this.cart.add(this.product());
    void this.router.navigate(['/minha-lista']);
  }
}
