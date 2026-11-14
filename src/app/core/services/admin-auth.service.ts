import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly authorization = signal<string | null>(null);
  readonly authenticated = signal(false);

  header(): string | null { return this.authorization(); }

  async login(username: string, password: string): Promise<void> {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    const header = `Basic ${btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))}`;
    try {
      await firstValueFrom(this.http.get(`${API_BASE_URL}/csrf`));
      await firstValueFrom(this.http.get(`${API_BASE_URL}/admin/profile`, { headers: { Authorization: header } }));
      this.authorization.set(header);
      this.authenticated.set(true);
    } catch (error) {
      this.logout();
      if (error instanceof HttpErrorResponse && error.status === 401) throw new Error('Usuário ou senha incorretos.');
      throw new Error('Não foi possível entrar no painel. Verifique a API e tente novamente.');
    }
  }

  logout(): void {
    this.authorization.set(null);
    this.authenticated.set(false);
  }
}
