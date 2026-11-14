import { OrderStatus } from '../models/order.model';

export interface ApiCategory { id: string; name: string; slug: string }
export interface ApiProductImage { id: string; url: string; altText: string; displayOrder: number; type: 'image' | 'video' | null }
export interface ApiProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  active: boolean;
  bestSeller: boolean;
  badge: string | null;
  images: ApiProductImage[];
  createdAt: string;
  updatedAt: string;
}
export interface ApiProductRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  active: boolean;
  bestSeller: boolean;
  badge: string | null;
  images: Array<Pick<ApiProductImage, 'url' | 'altText' | 'displayOrder' | 'type'>>;
}
export interface ApiOrderItem { id: string; productId: string; productName: string; quantity: number; unitPrice: number }
export interface ApiOrder {
  id: string;
  customerName: string;
  contact: string | null;
  status: OrderStatus;
  total: number;
  items: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
}
export interface ApiPage<T> { content: T[]; page: number; size: number; totalElements: number }
export interface ApiProfile { id: string; fullName: string; nickname: string | null; photoUrl: string | null; updatedAt: string }
