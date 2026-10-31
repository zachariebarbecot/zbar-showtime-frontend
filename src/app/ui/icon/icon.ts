import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  watchlist: 'M6 3h12v18l-6-4-6 4z',
  seen: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6L6 18',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z',
  eyeOff:
    'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  alert: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 8v5M12 16.5v.01',
  home: 'M4 11l8-7 8 7M6 10v9h12v-9',
  chevron: 'M6 9l6 6 6-6',
  logout: 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10',
  dot: 'M12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3z',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'svg[appIcon]',
  template: '<svg:path [attr.d]="path()" />',
  host: {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
export class Icon {
  readonly name = input.required<IconName>();
  protected readonly path = computed(() => PATHS[this.name()]);
}
