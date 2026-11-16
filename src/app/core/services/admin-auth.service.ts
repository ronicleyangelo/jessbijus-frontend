import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, timeout, TimeoutError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface CurrentAdmin { username: string; role: string }

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  readonly authenticated = signal(false);
  readonly user = signal<CurrentAdmin | null>(null);
  readonly loginRetrySeconds = signal(0);
  private checking: Promise<boolean> | null = null;
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.cooldownTimer !== null) clearInterval(this.cooldownTimer);
    });
  }

  clearSession(): void { this.user.set(null); this.authenticated.set(false); }

  async restoreSession(): Promise<boolean> {
    if (!this.checking) {
      this.checking = this.request(this.http.get<CurrentAdmin>(`${API_BASE_URL}/auth/me`))
        .then(user => { this.user.set(user); this.authenticated.set(true); return true; })
        .catch(() => { this.clearSession(); return false; })
        .finally(() => { this.checking = null; });
    }
    return this.checking;
  }

  async login(username: string, password: string): Promise<void> {
    if (this.loginRetrySeconds() > 0) throw new Error('Aguarde o tempo indicado antes de tentar novamente.');
    try {
      await this.request(this.http.get(`${API_BASE_URL}/csrf`));
      const body = new URLSearchParams({ username, password });
      await this.request(this.http.post(`${API_BASE_URL}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }));
      await this.request(this.http.get(`${API_BASE_URL}/csrf`));
      this.user.set(await this.request(this.http.get<CurrentAdmin>(`${API_BASE_URL}/auth/me`)));
      this.authenticated.set(true);
    } catch (error) {
      this.clearSession();
      if (error instanceof TimeoutError) throw new Error('A API demorou para responder. Verifique a conexão e tente novamente.');
      if (error instanceof HttpErrorResponse && error.status === 429) {
        this.startLoginCooldown(error);
        throw new Error('Limite de tentativas atingido. Aguarde o tempo indicado para tentar novamente.');
      }
      if (error instanceof HttpErrorResponse && error.status === 401) throw new Error('Usuário ou senha incorretos.');
      throw new Error('Não foi possível entrar no painel. Verifique a API e tente novamente.');
    }
  }

  async logout(): Promise<void> {
    await this.request(this.http.get(`${API_BASE_URL}/csrf`));
    await this.request(this.http.post(`${API_BASE_URL}/auth/logout`, {}));
    this.clearSession();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.request(this.http.get(`${API_BASE_URL}/csrf`));
      await this.request(this.http.post(`${API_BASE_URL}/auth/password`, { currentPassword, newPassword }));
      this.clearSession();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 429) {
          const seconds = this.retryAfterSeconds(error);
          throw new Error(`Muitas tentativas. Tente novamente em ${Math.ceil(seconds / 60)} minuto(s).`);
        }
        if (error.status === 400) throw new Error(error.error?.detail || 'Confira a senha atual e use pelo menos 8 caracteres com um símbolo na nova senha.');
      }
      throw new Error('Não foi possível alterar a senha. Tente novamente.');
    }
  }

  private retryAfterSeconds(error: HttpErrorResponse): number {
    const retryAfter = Number(error.headers.get('Retry-After'));
    return Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 900;
  }
  private startLoginCooldown(error: HttpErrorResponse): void {
    const seconds = this.retryAfterSeconds(error);
    const deadline = Date.now() + seconds * 1000;
    if (this.cooldownTimer !== null) clearInterval(this.cooldownTimer);
    this.loginRetrySeconds.set(seconds);
    this.cooldownTimer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      this.loginRetrySeconds.set(remaining);
      if (remaining === 0 && this.cooldownTimer !== null) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }

  private request<T>(request: Observable<T>): Promise<T> {
    return firstValueFrom(request.pipe(timeout(15_000)));
  }
}
