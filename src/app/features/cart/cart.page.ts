import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ShopCartService } from '../../core/services/shop-cart.service';
import { ShopCatalogService } from '../../core/services/shop-catalog.service';
import { faHeartRegular } from '../../shared/icons';
import { ApiClient } from '../../core/api/api-client';
import { firstValueFrom, timeout } from 'rxjs';

const WHATSAPP_NUMBER = '5527992285969';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, RouterLink, FaIconComponent],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly cart = inject(ShopCartService);
  readonly catalog = inject(ShopCatalogService);
  private readonly api = inject(ApiClient);
  readonly heartIcon = faHeartRegular;
  readonly sending = signal(false);
  readonly error = signal('');

  changeQuantity(productId: string, quantity: number): void {
    this.cart.setQuantity(productId, quantity);
  }

  async sendOrder(event: Event, customerName: string, nameInput: HTMLInputElement): Promise<void> {
    event.preventDefault();
    const name = customerName.trim();
    if (!name) {
      nameInput.focus();
      nameInput.reportValidity();
      return;
    }
    if (!this.cart.items().length || typeof window === 'undefined' || this.sending()) return;

    this.sending.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.placeOrder(name, this.cart.items().map(item => ({ productId: item.product.id, quantity: item.quantity }))).pipe(timeout(15_000)));
    } catch {
      this.error.set('Não foi possível confirmar o pedido. Verifique sua conexão e tente novamente.');
      return;
    } finally {
      this.sending.set(false);
    }
    const lines = [
      'Olá! Gostaria de fazer um pedido na Jessbijus.',
      `Nome: ${name}`,
      '',
      ...this.cart.items().map(item =>
        `• ${item.product.name} — ${item.quantity} × ${currency.format(item.product.price)} = ${currency.format(item.subtotal)}`,
      ),
      '',
      `Total das peças: ${currency.format(this.cart.total())}`,
      'Podemos combinar entrega e pagamento por aqui?',
    ];
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer');
  }
}
