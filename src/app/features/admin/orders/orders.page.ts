import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { AdminOrdersService } from '../../../core/services/admin-orders.service';
import { OrderStatus } from '../../../core/models/order.model';
import { ShopCatalogService } from '../../../core/services/shop-catalog.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

type OrderFilter = 'all' | 'waiting' | 'confirmed' | 'shipped';
const PAGE_SIZE = 5;

@Component({
  selector: 'app-orders-page',
  imports: [CurrencyPipe, DatePipe, FormsModule, FaIconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPage {
  readonly orders = inject(AdminOrdersService);
  readonly catalog = inject(ShopCatalogService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly plusIcon = faPlus;
  readonly filter = signal<OrderFilter>('all');
  readonly page = signal(1);
  readonly selectedOrderId = signal<string | null>(null);
  readonly registering = signal(false);
  readonly filteredOrders = computed(() => this.orders.recent().filter(order => {
    const filter = this.filter();
    return filter === 'all' || (filter === 'waiting' && (order.status === 'AWAITING_PIX' || order.status === 'AWAITING_CONTACT')) ||
      (filter === 'confirmed' && order.status === 'CONFIRMED') || (filter === 'shipped' && order.status === 'SHIPPED');
  }));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredOrders().length / PAGE_SIZE)));
  readonly visibleOrders = computed(() => this.filteredOrders().slice((Math.min(this.page(), this.pageCount()) - 1) * PAGE_SIZE, Math.min(this.page(), this.pageCount()) * PAGE_SIZE));
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, index) => index + 1));
  readonly selectedOrder = computed(() => {
    const requested = this.selectedOrderId() ?? this.params().get('pedido');
    return this.orders.orders().find(order => order.id === requested) ?? this.visibleOrders()[0];
  });

  customerName = '';
  contact = '';
  productId = '';
  quantity = 1;
  readonly draftItems = signal<Array<{ productId: string; quantity: number }>>([]);
  readonly draftTotal = computed(() => this.draftItems().reduce((total, item) => total + (this.catalog.find(item.productId)?.price ?? 0) * item.quantity, 0));
  feedback = '';
  error = '';
  saving = false;

  setFilter(value: OrderFilter): void {
    this.filter.set(value);
    this.page.set(1);
    this.selectedOrderId.set(null);
    this.registering.set(false);
  }

  selectOrder(orderId: string): void {
    this.selectedOrderId.set(orderId);
    this.registering.set(false);
    this.feedback = '';
  }

  setPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
    this.selectedOrderId.set(null);
  }

  addItem(): void {
    const product = this.catalog.find(this.productId);
    const alreadySelected = this.draftItems().find(item => item.productId === this.productId)?.quantity ?? 0;
    if (!product || !Number.isInteger(Number(this.quantity)) || this.quantity < 1 || Number(this.quantity) + alreadySelected > product.stockQuantity) {
      this.error = 'Selecione um produto disponível e uma quantidade válida.';
      this.toast.warn(this.error);
      return;
    }
    this.draftItems.update(items => {
      const previous = items.find(item => item.productId === product.id);
      return previous ? items.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + Number(this.quantity) } : item) : [...items, { productId: product.id, quantity: Number(this.quantity) }];
    });
    this.productId = '';
    this.quantity = 1;
    this.error = '';
  }

  removeItem(productId: string): void { this.draftItems.update(items => items.filter(item => item.productId !== productId)); }

  async createOrder(): Promise<void> {
    if (!this.customerName.trim() || !this.draftItems().length) {
      this.error = 'Preencha o nome da cliente e adicione pelo menos uma peça.';
      this.toast.warn(this.error);
      return;
    }
    this.saving = true;
    try {
      const order = await this.orders.create(this.customerName.trim(), this.draftItems(), this.contact.trim());
      this.customerName = '';
      this.contact = '';
      this.draftItems.set([]);
      this.error = '';
      this.feedback = `${order.code} registrado na API. Confirme o Pix depois de receber o pagamento.`;
      this.toast.success(this.feedback);
      this.filter.set('all');
      this.page.set(1);
      this.selectedOrderId.set(order.id);
      this.registering.set(false);
    } catch {
      this.error = 'Não foi possível registrar o pedido. Confira a conexão e o estoque das peças.';
      this.toast.error(this.error);
    } finally { this.saving = false; }
  }

  async updateStatus(status: OrderStatus): Promise<void> {
    const order = this.selectedOrder();
    if (!order) return;
    this.saving = true;
    try {
      await this.orders.setStatus(order.id, status);
      this.error = '';
      this.feedback = status === 'AWAITING_PIX' ? 'Pedido atualizado para Aguardando Pix.' : status === 'CONFIRMED' ? 'Pagamento confirmado. Separe as peças para envio.' : 'Pedido marcado como enviado. Avise a cliente pelo WhatsApp.';
      this.toast.success(this.feedback);
    } catch {
      this.error = 'Não foi possível atualizar o pedido na API.';
      this.toast.error(this.error);
    } finally { this.saving = false; }
  }

  statusLabel(status: OrderStatus): string {
    return ({ AWAITING_CONTACT: 'Aguardando contato', AWAITING_PIX: 'Aguardando Pix', CONFIRMED: 'Confirmado', SHIPPED: 'Enviado', CANCELED: 'Cancelado' })[status];
  }

  statusClass(status: OrderStatus): string {
    return status === 'CONFIRMED' ? 'confirmed' : status === 'SHIPPED' ? 'shipped' : status === 'CANCELED' ? 'canceled' : 'waiting';
  }
}
