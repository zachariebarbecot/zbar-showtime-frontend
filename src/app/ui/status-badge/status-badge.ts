import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

export type WatchlistBadgeStatus = 'watchlist' | 'seen' | 'progress' | 'dropped';

const STATUSES: Record<WatchlistBadgeStatus, { readonly label: string; readonly icon: IconName }> =
  {
    watchlist: { label: 'Watchlist', icon: 'watchlist' },
    seen: { label: 'Vu', icon: 'seen' },
    progress: { label: 'En cours', icon: 'eye' },
    dropped: { label: 'Abandonné', icon: 'eyeOff' },
  };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-status-badge',
  imports: [Icon],
  template: `
    <span [class]="'zb-badge zb-badge-' + status()">
      <svg appIcon [name]="statuses[status()].icon"></svg>{{ statuses[status()].label }}
    </span>
  `,
  host: { style: 'display: contents' },
})
export class StatusBadge {
  readonly status = input.required<WatchlistBadgeStatus>();

  protected readonly statuses = STATUSES;
}
