import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);
  private readonly key = 'jessbijus-toast';

  success(detail: string, summary = 'Sucesso'): void {
    this.messages.add({ key: this.key, severity: 'success', summary, detail, life: 4000 });
  }

  error(detail: string, summary = 'Erro'): void {
    this.messages.add({ key: this.key, severity: 'error', summary, detail, life: 6000 });
  }

  warn(detail: string, summary = 'Atenção'): void {
    this.messages.add({ key: this.key, severity: 'warn', summary, detail, life: 5000 });
  }
}
