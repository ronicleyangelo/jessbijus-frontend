export type OrderStatus =
  | 'AWAITING_CONTACT'
  | 'AWAITING_PIX'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'CANCELED';

export interface OrderItemDraft {
  productId: string;
  quantity: number;
}

export interface OrderDraft {
  customerName: string;
  items: OrderItemDraft[];
}
