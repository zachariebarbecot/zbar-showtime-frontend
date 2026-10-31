import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-menu',
  imports: [Icon],
  template: `
    <div class="zb-um">
      <button type="button" class="zb-um-btn" aria-haspopup="menu" aria-expanded="false">
        <span class="zb-avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="zb-um-name">{{ firstName() }} {{ lastName() }}</span>
        <svg appIcon name="chevron"></svg>
      </button>
    </div>
  `,
})
export class UserMenu {
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly email = input.required<string>();

  readonly logout = output<void>();

  protected readonly initials = computed(() =>
    `${this.firstName().charAt(0)}${this.lastName().charAt(0)}`.toUpperCase(),
  );
}
