import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLoginPage } from './admin-login.page';
import { AdminAuthService } from '../../../core/services/admin-auth.service';

describe('AdminLoginPage loading feedback', () => {
  const auth = { login: vi.fn(), loginRetrySeconds: signal(0) };

  beforeEach(async () => {
    auth.login.mockReset();
    auth.loginRetrySeconds.set(0);
    await TestBed.configureTestingModule({
      imports: [AdminLoginPage],
      providers: [provideRouter([]), { provide: AdminAuthService, useValue: auth }],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  it('returns to Entrar and displays the error when the request fails', async () => {
    let fail!: (error: Error) => void;
    auth.login.mockImplementation(() => new Promise<void>((resolve, reject) => { fail = reject; }));
    const fixture = TestBed.createComponent(AdminLoginPage);
    fixture.detectChanges();
    const login = fixture.componentInstance.login();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Entrando');
    expect(button.disabled).toBe(true);
    await fixture.componentInstance.login();
    expect(auth.login).toHaveBeenCalledTimes(1);
    fail(new Error('A API demorou para responder.'));
    await login;
    await fixture.whenStable();
    expect(button.textContent?.trim()).toBe('Entrar');
    expect(button.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('A API demorou');
  });

  it('shows the wait time instead of getting stuck on Entrando when rate limited', async () => {
    auth.login.mockImplementation(async () => {
      auth.loginRetrySeconds.set(900);
      throw new Error('Limite de tentativas atingido.');
    });
    const fixture = TestBed.createComponent(AdminLoginPage);
    fixture.detectChanges();
    await fixture.componentInstance.login();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Entrar');
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('15:00');
  });

  it('leaves the loading state when navigation is cancelled', async () => {
    auth.login.mockResolvedValue(undefined);
    vi.mocked(TestBed.inject(Router).navigateByUrl).mockResolvedValue(false);
    const fixture = TestBed.createComponent(AdminLoginPage);
    await fixture.componentInstance.login();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toContain('Não foi possível abrir o painel');
  });
});
