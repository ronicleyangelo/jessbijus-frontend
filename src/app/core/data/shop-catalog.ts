import { ShopFilter, ShopProduct } from '../models/shop-product.model';

export const SHOP_FILTERS: ReadonlyArray<{ slug: ShopFilter; label: string }> = [
  { slug: 'todos', label: 'Todos' },
  { slug: 'novidades', label: 'Novidades' },
  { slug: 'brincos', label: 'Brincos' },
  { slug: 'colares', label: 'Colares' },
  { slug: 'pulseiras', label: 'Pulseiras' },
  { slug: 'aneis', label: 'Anéis' },
  { slug: 'conjuntos', label: 'Conjuntos' },
  { slug: 'mais-vendidos', label: 'Mais vendidos' },
];

// Referência visual do protótipo; a loja exibida ao cliente é carregada da API.
export const SHOP_PRODUCTS: ReadonlyArray<ShopProduct> = [
  {
    id: 'brinco-corrente-candy',
    name: 'Brinco corrente candy',
    description: 'Brinco artesanal com correntes e contas coloridas.',
    price: 39.9,
    imageUrl: '/images/brinco-corrente-candy.png',
    imageAlt: 'Brinco corrente candy com contas rosas e azuis',
    category: 'brincos',
    isBestSeller: true,
    badge: 'MAIS VENDIDO',
    stockQuantity: 12,
  },
  {
    id: 'brinco-perolas-franjas',
    name: 'Brinco pérolas e franjas',
    description: 'Brinco de pérolas brancas com franjas delicadas.',
    price: 49.9,
    imageUrl: '/images/brinco-perolas-franjas.png',
    imageAlt: 'Brincos de pérolas brancas com franjas',
    category: 'brincos',
    // badge: 'FEITO À MÃO',
    stockQuantity: 8,
  },
  {
    id: 'colar-pedras-cafe',
    name: 'Colar pedras café',
    description: 'Colar artesanal longo com pedras em tons de café.',
    price: 59.9,
    imageUrl: '/images/colar-pedras-cafe.png',
    imageAlt: 'Colar de pedras café em expositor branco',
    category: 'colares',
    badge: 'PEÇA ÚNICA',
    stockQuantity: 1,
  },
  {
    id: 'brinco-gotas-classicas',
    name: 'Brinco gotas clássicas',
    description: 'Brinco de contas brancas e café em formato de gotas.',
    price: 44.9,
    imageUrl: '/images/brinco-gotas-classicas.png',
    imageAlt: 'Brincos em gotas com contas brancas e café',
    category: 'brincos',
    isNew: true,
    badge: 'NOVO',
    stockQuantity: 10,
  },
];

export function isShopFilter(value: string | null): value is ShopFilter {
  return SHOP_FILTERS.some(filter => filter.slug === value);
}

export function filterProducts(products: ReadonlyArray<ShopProduct>, filter: ShopFilter, search: string): ShopProduct[] {
  const query = normalizeSearch(search);
  return products.filter(product => {
    const matchesFilter =
      filter === 'todos' ||
      (filter === 'novidades' && product.isNew) ||
      (filter === 'mais-vendidos' && product.isBestSeller) ||

      product.category === filter;
    if (!matchesFilter) return false;
    if (!query) return true;
    return normalizeSearch([product.name, product.description, product.category].join(' ')).includes(query);
  });
}

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}
