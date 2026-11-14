import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBoxOpen, faChartLine, faClock, faClipboardList, faPlus } from '@fortawesome/free-solid-svg-icons';
import { AdminOrdersService } from '../../../core/services/admin-orders.service';
import { ShopCatalogService } from '../../../core/services/shop-catalog.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, FaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  readonly orders = inject(AdminOrdersService);
  readonly catalog = inject(ShopCatalogService);
  readonly sales = computed(() => this.orders.orders().filter(order => order.status === 'CONFIRMED' || order.status === 'SHIPPED').reduce((sum, order) => sum + order.total, 0));
  readonly awaiting = computed(() => this.orders.orders().filter(order => order.status === 'AWAITING_PIX').length);
  readonly lowStock = computed(() => this.catalog.activeProducts().filter(product => product.stockQuantity <= 3));
  readonly icons = { sales: faChartLine, orders: faClipboardList, awaiting: faClock, products: faBoxOpen, plus: faPlus };

  statusLabel(status: string): string {
    return ({ AWAITING_PIX: 'Aguardando', AWAITING_CONTACT: 'Contato', CONFIRMED: 'Confirmado', SHIPPED: 'Enviado', CANCELED: 'Cancelado' } as Record<string, string>)[status] ?? status;
  }

  statusClass(status: string): string {
    return status === 'CONFIRMED' ? 'confirmed' : status === 'SHIPPED' ? 'shipped' : status === 'CANCELED' ? 'canceled' : 'waiting';
  }
}
