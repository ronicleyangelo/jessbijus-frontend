import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { ApiProfile } from '../api/api-models';

export interface AdminProfile { name: string; nickname: string; photoUrl: string | null }
const DEFAULT_PROFILE: AdminProfile = { name: 'Jess', nickname: 'Jess', photoUrl: null };

@Injectable({ providedIn: 'root' })
export class AdminProfileService {
  private readonly api = inject(ApiClient);
  readonly profile = signal<AdminProfile>(DEFAULT_PROFILE);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.profile.set(this.mapProfile(await firstValueFrom(this.api.profile())));
      this.error.set('');
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 404)) this.error.set('Não foi possível carregar o perfil da API.');
    } finally { this.loading.set(false); }
  }

  async save(profile: AdminProfile): Promise<void> {
    const saved = await firstValueFrom(this.api.saveProfile(profile.name, profile.nickname, profile.photoUrl));
    this.profile.set(this.mapProfile(saved));
    this.error.set('');
  }

  private mapProfile(profile: ApiProfile): AdminProfile {
    return { name: profile.fullName, nickname: profile.nickname || profile.fullName, photoUrl: profile.photoUrl };
  }
}
