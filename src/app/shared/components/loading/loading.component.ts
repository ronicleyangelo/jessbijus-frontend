import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading',
  imports: [ProgressSpinnerModule],
  template: '<div class="loading" [class.loading--overlay]="overlay()" role="status" aria-live="polite"><p-progress-spinner strokeWidth="5" aria-hidden="true" /><span>{{ message() }}</span></div>',
  styleUrl: './loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  readonly message = input('Carregando...');
  readonly overlay = input(false);
}
