import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
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
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="locked() || null"
      (click)="press()"
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
  readonly ariaLabel = input<string>();
  readonly iconOnly = input(false);
  readonly controlled = input(false);
  readonly locked = input(false);
  readonly add = output<void>();

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

  protected press(): void {
    if (this.locked()) return;
    if (this.controlled()) this.add.emit();
    else this.active.set(!this.active());
  }
}
