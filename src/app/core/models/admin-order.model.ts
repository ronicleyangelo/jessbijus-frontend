import { OrderStatus } from './order.model';

export interface AdminOrder {
  id: string;
  code: string;
  customerName: string;
  contact: string;
  itemsSummary: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
