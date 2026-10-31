import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #content>
      <svg class="zb-logo-mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect class="zb-logo-bg" width="32" height="32" rx="8" />
        <circle class="zb-logo-bulb" cx="9" cy="6.5" r="1.5" />
        <circle class="zb-logo-bulb" cx="16" cy="6.5" r="1.5" />
        <circle class="zb-logo-bulb" cx="23" cy="6.5" r="1.5" />
        <path class="zb-logo-z" d="M10 12h12L10 24h12" />
      </svg>
      @if (variant() === 'full') {
        <span class="zb-logo-word" aria-hidden="true">Zbar <span>Showtime</span></span>
      }
    </ng-template>
    @if (href(); as href) {
      <a [class]="classes()" [href]="href" role="img" aria-label="Zbar Showtime">
        <ng-container *ngTemplateOutlet="content" />
      </a>
    } @else {
      <span [class]="classes()" role="img" aria-label="Zbar Showtime">
        <ng-container *ngTemplateOutlet="content" />
      </span>
    }
  `,
  host: { style: 'display: contents' },
})
export class Logo {
  readonly size = input<'md' | 'lg'>('md');
  readonly variant = input<'full' | 'mark'>('full');
  readonly href = input<string>();

  protected readonly classes = computed(() => `zb-logo zb-logo-${this.size()}`);
}
