import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-menu',
  imports: [Icon],
  template: `
    <div class="zb-um">
      <button
        #trigger
        type="button"
        class="zb-um-btn"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
      >
        <span class="zb-avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="zb-um-name">{{ firstName() }} {{ lastName() }}</span>
        <svg appIcon name="down"></svg>
      </button>
      @if (open()) {
        <div class="zb-um-menu" role="menu" aria-label="Compte">
          <div class="zb-um-who">
            <div class="zb-um-who-name">{{ firstName() }} {{ lastName() }}</div>
            <div class="zb-meta">{{ email() }}</div>
          </div>
          <button #item type="button" class="zb-um-item" role="menuitem" (click)="logoutClicked()">
            <svg appIcon name="logout"></svg>
            Se déconnecter
          </button>
        </div>
      }
    </div>
  `,
  host: {
    style: 'display: contents',
    '(keydown.escape)': 'close()',
    '(document:click)': 'closeOnOutsideClick($event)',
  },
})
export class UserMenu {
  readonly firstName = input.required<string>();
  readonly lastName = input.required<string>();
  readonly email = input.required<string>();
  readonly logout = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly item = viewChild<ElementRef<HTMLButtonElement>>('item');

  protected readonly open = signal(false);
  protected readonly initials = computed(() =>
    `${this.firstName().charAt(0)}${this.lastName().charAt(0)}`.toUpperCase(),
  );

  protected toggle(): void {
    if (this.open()) {
      this.open.set(false);
      return;
    }
    this.open.set(true);
    afterNextRender(() => this.item()?.nativeElement.focus(), { injector: this.injector });
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.trigger().nativeElement.focus();
    }
  }

  protected closeOnOutsideClick(event: Event): void {
    if (event.target instanceof Node && !this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  protected logoutClicked(): void {
    this.open.set(false);
    this.logout.emit();
  }
}
