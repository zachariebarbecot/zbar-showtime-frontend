import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { ToastService } from './toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  imports: [Icon],
  template: `<div role="status" aria-live="polite">
    @if (toasts.message(); as message) {
      <div class="zb-toast">
        <p>{{ message }}</p>
        <button
          type="button"
          class="zb-icon-btn zb-icon-btn-sm"
          aria-label="Fermer"
          (click)="toasts.dismiss()"
        >
          <svg appIcon name="close"></svg>
        </button>
      </div>
    }
  </div>`,
})
export class Toast {
  protected readonly toasts = inject(ToastService);
}
