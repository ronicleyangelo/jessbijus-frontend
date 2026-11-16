import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [FormsModule, RouterLink],
  template: `<main class="admin-login"><form (ngSubmit)="login()"><h1>Área da loja</h1><p>Entre para gerenciar produtos, pedidos e perfil.</p><label for="admin-user">Usuário</label><input id="admin-user" name="username" [(ngModel)]="username" autocomplete="username" required /><label for="admin-password">Senha</label><input id="admin-password" name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required />@if (error()) { <p role="alert" class="admin-login__error">{{ error() }}</p> }@if (auth.loginRetrySeconds() > 0) { <p role="status">Tente novamente em {{ retryTime }}.</p> }<button type="submit" [disabled]="loading() || auth.loginRetrySeconds() > 0">{{ loading() ? 'Entrando...' : 'Entrar' }}</button><a routerLink="/">Voltar à loja</a></form></main>`,
  styles: [`:host{display:block}.admin-login{display:grid;min-height:100vh;place-items:center;padding:24px;background:var(--jb-color-cream);color:var(--jb-color-brown)}form{display:grid;gap:12px;width:min(100%,390px);padding:32px;border-radius:16px;background:#fff}h1{margin:0;font-size:32px}p{margin:0 0 12px;color:var(--jb-color-text-muted)}label{font-size:13px;font-weight:700}input{height:44px;padding:0 12px;border:1px solid var(--jb-color-border);border-radius:8px;font:inherit}button{height:46px;margin-top:12px;border:0;border-radius:24px;background:var(--jb-color-brown);color:#fff;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.6}a{margin-top:10px;color:inherit;text-align:center}.admin-login__error{margin:0;color:var(--jb-color-danger);font-size:13px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginPage {
  readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  username = '';
  password = '';
  readonly error = signal(inject(ActivatedRoute).snapshot.queryParamMap.has('expired')
    ? 'Sua sessão expirou. Entre novamente.'
    : inject(ActivatedRoute).snapshot.queryParamMap.has('passwordChanged')
      ? 'Senha alterada. Entre com a nova senha.' : '');
  readonly loading = signal(false);

  get retryTime(): string {
    const seconds = this.auth.loginRetrySeconds();
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  async login(): Promise<void> {
    if (this.loading() || this.auth.loginRetrySeconds() > 0) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.username.trim(), this.password);
      this.password = '';
      if (!await this.router.navigateByUrl('/admin/visao-geral')) {
        throw new Error('Não foi possível abrir o painel. Tente novamente.');
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Não foi possível entrar.');
    } finally { this.loading.set(false); }
  }
}
