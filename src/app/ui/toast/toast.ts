import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  template: `<div role="status" aria-live="polite">
    @if (toasts.message(); as message) {
      <p class="zb-toast">{{ message }}</p>
    }
  </div>`,
})
export class Toast {
  protected readonly toasts = inject(ToastService);
}
