export type ShopCategory = 'brincos' | 'colares' | 'pulseiras' | 'conjuntos' | 'aneis';

export type ShopFilter = 'todos' | 'novidades' | ShopCategory | 'mais-vendidos';

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  category: ShopCategory;
  subcategories?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  badge?: string;
  stockQuantity: number;
  active?: boolean;
  media?: import('./product-media.model').ProductMedia[];
}
