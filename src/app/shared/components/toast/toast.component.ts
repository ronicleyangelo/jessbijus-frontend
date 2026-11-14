import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-toast',
  imports: [ToastModule],
  template: '<p-toast key="jessbijus-toast" position="top-right" styleClass="jessbijus-toast" />',
  styleUrl: './toast.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {}
