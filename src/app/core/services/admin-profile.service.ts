import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiProfile } from '../api/api-models';
import { AdminAuthService } from './admin-auth.service';

export interface AdminProfile { name: string; nickname: string; photoUrl: string | null }

@Injectable({ providedIn: 'root' })
export class AdminProfileService {
  private readonly api = inject(ApiClient);
  private readonly auth = inject(AdminAuthService);
  private readonly savedProfile = signal<{ username: string; profile: AdminProfile } | null>(null);
  private requestVersion = 0;
  readonly profile = computed<AdminProfile>(() => {
    const username = this.auth.user()?.username || '';
    const saved = this.savedProfile();
    return saved?.username === username ? saved.profile : { name: username, nickname: username, photoUrl: null };
  });
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    effect(() => {
      const username = this.auth.user()?.username;
      untracked(() => {
        if (username) { void this.load(); }
        else {
          this.requestVersion++;
          this.savedProfile.set(null);
          this.loading.set(false);
          this.error.set('');
        }
      });
    });
  }

  async load(): Promise<void> {
    const username = this.auth.user()?.username;
    if (!username) return;
    const version = ++this.requestVersion;
    this.savedProfile.set(null);
    this.error.set('');
    this.loading.set(true);
    try {
      const profile = await firstValueFrom(this.api.profile());
      if (version !== this.requestVersion || username !== this.auth.user()?.username) return;
      this.savedProfile.set({ username, profile: this.mapProfile(profile) });
      this.error.set('');
    } catch (error) {
      if (version !== this.requestVersion || username !== this.auth.user()?.username) return;
      if (!(error instanceof HttpErrorResponse && error.status === 404)) this.error.set('Não foi possível carregar o perfil da API.');
    } finally { if (version === this.requestVersion) this.loading.set(false); }
  }

  async save(profile: AdminProfile): Promise<void> {
    const username = this.auth.user()?.username;
    if (!username) throw new Error('Entre novamente para salvar o perfil.');
    const version = ++this.requestVersion;
    const saved = await firstValueFrom(this.api.saveProfile(profile.name, profile.nickname, profile.photoUrl));
    if (version !== this.requestVersion || username !== this.auth.user()?.username) return;
    this.savedProfile.set({ username, profile: this.mapProfile(saved) });
    this.loading.set(false);
    this.error.set('');
  }

  private mapProfile(profile: ApiProfile): AdminProfile {
    return { name: profile.fullName, nickname: profile.nickname || profile.fullName, photoUrl: profile.photoUrl };
  }
}
