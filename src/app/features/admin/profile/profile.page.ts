import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { AdminProfileService } from '../../../core/services/admin-profile.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { passwordChangeValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-profile-page',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  readonly profileService = inject(AdminProfileService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly passwordForm = inject(NonNullableFormBuilder).group({
    currentPassword: ['', [Validators.required, Validators.maxLength(128)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/[^\p{L}\p{N}\s]/u)]],
    confirmPassword: ['', [Validators.required, Validators.maxLength(128)]],
  }, { validators: passwordChangeValidator });
  passwordError = '';
  changingPassword = false;
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
    if (this.saving) return;
    this.saving = true;
    try {
      await this.profileService.save({ name: this.name.trim(), nickname: this.nickname.trim(), photoUrl: this.photoUrl });
      this.error = '';
      this.saved = true;
      this.toast.success('Perfil atualizado com sucesso.');
    } catch {
      this.error = 'Não foi possível salvar o perfil na API.';
      this.toast.error(this.error);
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }

  cancel(): void {
    const profile = this.profileService.profile();
    this.name = profile.name;
    this.nickname = profile.nickname;
    this.photoUrl = profile.photoUrl;
    this.error = '';
    this.saved = false;
  }

  async changePassword(): Promise<void> {
    if (this.changingPassword) return;
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.passwordForm.pending) {
      return;
    }
    this.changingPassword = true;
    this.passwordError = '';
    try {
      const { currentPassword, newPassword } = this.passwordForm.getRawValue();
      await this.auth.changePassword(currentPassword, newPassword);
      this.passwordForm.reset();
      await this.router.navigate(['/admin/login'], { queryParams: { passwordChanged: '1' } });
    } catch (error) {
      this.passwordError = error instanceof Error ? error.message : 'Não foi possível alterar a senha.';
    } finally { this.changingPassword = false; this.changeDetector.markForCheck(); }
  }

  passwordFieldError(field: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.passwordForm.controls[field];
    if (!control.touched && !control.dirty) return '';
    if (control.hasError('required')) return field === 'confirmPassword' ? 'Confirme a nova senha.' : 'Informe a senha.';
    if (control.hasError('minlength')) return 'Use pelo menos 8 caracteres.';
    if (control.hasError('pattern')) return 'Inclua pelo menos um símbolo, como ! ou @.';
    if (control.hasError('maxlength')) return 'Use no máximo 128 caracteres.';
    if (field === 'newPassword' && this.passwordForm.hasError('passwordUnchanged')) return 'A nova senha deve ser diferente da atual.';
    if (field === 'confirmPassword' && this.passwordForm.hasError('passwordMismatch')) return 'A confirmação não corresponde à nova senha.';
    return '';
  }
}
