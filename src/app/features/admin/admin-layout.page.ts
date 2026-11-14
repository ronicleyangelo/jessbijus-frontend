import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { filter, map } from 'rxjs';
import { faBars, faBox, faChartLine, faClipboardList, faUser } from '../../shared/icons';
import { BrandComponent } from '../../shared/components/brand/brand.component';
import { AdminProfileService } from '../../core/services/admin-profile.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-layout-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FaIconComponent, BrandComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.page.html',
  styleUrl: './admin-layout.page.scss',
})
export class AdminLayoutPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);
  readonly profile = inject(AdminProfileService).profile;
  readonly sidebarOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly section = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => this.sectionFromUrl(event.urlAfterRedirects)),
  ), { initialValue: this.sectionFromUrl(this.router.url) });
  readonly icons = {
    menu: faBars,
    overview: faChartLine,
    products: faBox,
    orders: faClipboardList,
    profile: faUser,
  };

  closeMenus(): void {
    this.sidebarOpen.set(false);
    this.profileOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }

  private sectionFromUrl(url: string): string {
    if (url.includes('/produtos')) return 'Produtos';
    if (url.includes('/pedidos')) return 'Pedidos';
    if (url.includes('/perfil')) return 'Meu perfil';
    return 'Visão geral';
  }
}
