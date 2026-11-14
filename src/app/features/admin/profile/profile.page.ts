import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminProfileService } from '../../../core/services/admin-profile.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule, RouterLink, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  readonly profileService = inject(AdminProfileService);
  private readonly toast = inject(ToastService);
  name = this.profileService.profile().name;
  nickname = this.profileService.profile().nickname;
  photoUrl = this.profileService.profile().photoUrl;
  saved = false;
  error = '';
  saving = false;
  private initialized = false;

  constructor() {
    effect(() => {
      if (this.initialized || this.profileService.loading()) return;
      const profile = this.profileService.profile();
      this.name = profile.name;
      this.nickname = profile.nickname;
      this.photoUrl = profile.photoUrl;
      this.initialized = true;
    });
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
      const image = await createImageBitmap(file);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const side = Math.min(image.width, image.height);
        canvas.getContext('2d')?.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 256, 256);
        this.photoUrl = canvas.toDataURL('image/jpeg', .82);
        this.error = '';
        this.saved = false;
      } finally { image.close(); }
    } catch (error) { this.error = error instanceof Error ? error.message : 'Não foi possível carregar a foto.'; this.toast.warn(this.error); }
    input.value = '';
  }

  async save(): Promise<void> {
    if (!this.name.trim() || !this.nickname.trim()) { this.error = 'Preencha nome e apelido.'; this.toast.warn(this.error); return; }
    this.saving = true;
    try {
      await this.profileService.save({ name: this.name.trim(), nickname: this.nickname.trim(), photoUrl: this.photoUrl });
      this.error = '';
      this.saved = true;
      this.toast.success('Perfil atualizado com sucesso.');
    } catch {
      this.error = 'Não foi possível salvar o perfil na API.';
      this.toast.error(this.error);
    } finally { this.saving = false; }
  }

  cancel(): void {
    const profile = this.profileService.profile();
    this.name = profile.name;
    this.nickname = profile.nickname;
    this.photoUrl = profile.photoUrl;
    this.error = '';
    this.saved = false;
  }
}
