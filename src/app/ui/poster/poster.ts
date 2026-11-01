import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { episodeCode } from '../../shared/episode-code';
import { Icon, IconName } from '../icon/icon';

export type PosterStatus = 'watchlist' | 'seen' | 'progress' | 'dropped';

export interface PosterEpisode {
  readonly season: number;
  readonly episode: number;
}

export interface PosterProgress {
  readonly seen: number;
  readonly total: number;
}

const STATUSES: Record<PosterStatus, { readonly label: string; readonly icon: IconName }> = {
  watchlist: { label: 'Watchlist', icon: 'watchlist' },
  seen: { label: 'Vu', icon: 'seen' },
  progress: { label: 'En cours', icon: 'eye' },
  dropped: { label: 'Abandonné', icon: 'eyeOff' },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-poster',
  imports: [Icon],
  template: `
    <div class="zb-poster">
      <div class="zb-poster-frame">
        @if (src(); as src) {
          <img [src]="src" alt="" />
        }
        @if (badge(); as badge) {
          <span class="zb-poster-badge">
            <span [class]="'zb-badge zb-badge-' + badge">
              <svg appIcon [name]="statuses[badge].icon"></svg>{{ statuses[badge].label }}
            </span>
          </span>
        }
        <span class="zb-poster-caption" [class.zb-poster-caption-scrim]="src()">
          <span class="zb-poster-title">{{ title() }}</span>
          @if (meta()) {
            <span class="zb-poster-meta">{{ meta() }}</span>
          }
          @if (code(); as code) {
            <span class="zb-poster-code" [attr.aria-label]="'Prochain épisode ' + code">{{
              code
            }}</span>
          }
        </span>
        @if (progress(); as progress) {
          <span
            class="zb-poster-progress"
            role="progressbar"
            aria-label="Épisodes vus"
            [attr.aria-valuenow]="progress.seen"
            [attr.aria-valuemax]="progress.total"
          >
            <span [style.width.%]="(100 * progress.seen) / progress.total"></span>
          </span>
        }
      </div>
    </div>
  `,
  host: { style: 'display: contents' },
})
export class Poster {
  readonly title = input.required<string>();
  readonly src = input<string>();
  readonly meta = input<string>();
  readonly status = input<PosterStatus>();
  readonly next = input<PosterEpisode>();
  readonly progress = input<PosterProgress>();

  protected readonly statuses = STATUSES;
  protected readonly badge = computed<PosterStatus | undefined>(
    () => this.status() ?? (this.progress() ? 'progress' : undefined),
  );
  protected readonly code = computed(() => {
    const next = this.next();
    return next && episodeCode(next.season, next.episode);
  });
}
