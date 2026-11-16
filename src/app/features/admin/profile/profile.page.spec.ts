import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './profile.page';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { AdminProfileService } from '../../../core/services/admin-profile.service';
import { ToastService } from '../../../core/services/toast.service';

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let page: ProfilePage;
  const save = vi.fn();
  const changePassword = vi.fn();
  const validPassword = 'uma senha nova de teste!';

  beforeEach(async () => {
    changePassword.mockReset().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        { provide: AdminAuthService, useValue: { changePassword } },
        { provide: AdminProfileService, useValue: {
          save, profile: signal({ name: 'Admin', nickname: 'Admin', photoUrl: null }),
          loading: signal(false), error: signal(''),
        } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ProfilePage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.each([true, false])('releases the profile overlay after save (success=%s)', async success => {
    let finish!: () => void;
    save.mockImplementationOnce(() => new Promise<void>((resolve, reject) => {
      finish = success ? resolve : () => reject(new Error('API'));
    }));
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Salvando perfil...');
    finish();
    await Promise.resolve();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Salvando perfil...');
    expect(fixture.nativeElement.textContent).toContain(success ? 'Voltar ao painel' : 'Salvar alterações');
  });
  function input(id: string, value: string): void {
    const field = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('does not show errors before interaction and blocks an empty submission', async () => {
    expect(fixture.nativeElement.querySelector('.profile-page__field-error')).toBeNull();
    const button = fixture.nativeElement.querySelector('fieldset')?.closest('form')?.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(page.passwordForm.invalid).toBe(true);
    await page.changePassword();
    expect(changePassword).not.toHaveBeenCalled();
    expect(page.passwordFieldError('currentPassword')).toBe('Informe a senha.');
  });

  it('shows the native minimum length error below the new password', () => {
    input('new-password', 'ab');
    expect(fixture.nativeElement.querySelector('#new-password-error')?.textContent).toContain('8 caracteres');
    expect(fixture.nativeElement.querySelector('#new-password').getAttribute('aria-invalid')).toBe('true');
    expect(page.passwordForm.controls.newPassword.hasError('minlength')).toBe(true);
  });

  it('revalidates confirmation when either password changes', () => {
    input('current-password', 'a senha atual de teste');
    input('new-password', validPassword);
    input('confirm-password', 'outra senha diferente!');
    expect(page.passwordFieldError('confirmPassword')).toContain('não corresponde');
    input('new-password', 'outra senha diferente!');
    expect(page.passwordFieldError('confirmPassword')).toBe('');
    expect(page.passwordForm.valid).toBe(true);
  });

  it('rejects the current password as the new password and enforces the upper limit', async () => {
    page.passwordForm.setValue({ currentPassword: validPassword, newPassword: validPassword, confirmPassword: validPassword });
    await page.changePassword();
    expect(page.passwordFieldError('newPassword')).toContain('diferente da atual');
    expect(changePassword).not.toHaveBeenCalled();
    page.passwordForm.controls.newPassword.setValue('a'.repeat(129));
    expect(page.passwordForm.controls.newPassword.hasError('maxlength')).toBe(true);
  });

  it('submits valid values and clears passwords after success', async () => {
    input('current-password', 'a senha atual de teste');
    input('new-password', validPassword);
    input('confirm-password', validPassword);
    const button = fixture.nativeElement.querySelector('fieldset')?.closest('form')?.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    await page.changePassword();
    expect(changePassword).toHaveBeenCalledWith('a senha atual de teste', validPassword);
    expect(page.passwordForm.getRawValue()).toEqual({ currentPassword: '', newPassword: '', confirmPassword: '' });
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/admin/login'], { queryParams: { passwordChanged: '1' } });
  });
});
