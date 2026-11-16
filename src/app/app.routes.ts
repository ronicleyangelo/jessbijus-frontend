import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layouts/store-layout.page').then(m => m.StoreLayoutPage),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/storefront/storefront.page').then(m => m.StorefrontPage) },
      { path: 'colecao', loadComponent: () => import('./features/catalog/catalog.page').then(m => m.CatalogPage) },
      { path: 'produto/:id', loadComponent: () => import('./features/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
      { path: 'minha-lista', loadComponent: () => import('./features/cart/cart.page').then(m => m.CartPage) },
    ],
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/admin-login.page').then(m => m.AdminLoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./features/admin/admin-layout.page').then(m => m.AdminLayoutPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'visao-geral' },
      { path: 'visao-geral', loadComponent: () => import('./features/admin/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'produtos', loadComponent: () => import('./features/admin/products/products.page').then(m => m.ProductsPage) },
      { path: 'pedidos', loadComponent: () => import('./features/admin/orders/orders.page').then(m => m.OrdersPage) },
      { path: 'perfil', loadComponent: () => import('./features/admin/profile/profile.page').then(m => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
