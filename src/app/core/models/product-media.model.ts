export type ProductMediaType = 'image' | 'video';

export interface ProductMedia {
  id: string;
  type: ProductMediaType;
  url: string;
  alt: string;
}
