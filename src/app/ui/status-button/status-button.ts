import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-button',
  template: '',
})
export class StatusButton {
  readonly kind = input.required<'watchlist' | 'seen'>();
  readonly size = input<'md' | 'sm'>('md');
  readonly active = model(false);
}
