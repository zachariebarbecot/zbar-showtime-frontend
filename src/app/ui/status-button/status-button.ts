import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-button',
  imports: [Icon],
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-pressed]="active()"
      (click)="active.set(!active())"
    >
      <svg appIcon [name]="icon()"></svg>{{ label() }}
    </button>
  `,
  host: { style: 'display: contents' },
})
export class StatusButton {
  readonly kind = input.required<'watchlist' | 'seen'>();
  readonly size = input<'md' | 'sm'>('md');
  readonly active = model(false);

  protected readonly classes = computed(
    () => `zb-btn zb-btn-${this.kind()}${this.size() === 'sm' ? ' zb-btn-sm' : ''}`,
  );
  protected readonly icon = computed(() =>
    this.active() || this.kind() === 'seen' ? this.kind() : 'plus',
  );
  protected readonly label = computed(() => {
    if (this.kind() === 'watchlist') return 'Watchlist';
    return this.active() ? 'Vu' : 'Marquer vu';
  });
}
