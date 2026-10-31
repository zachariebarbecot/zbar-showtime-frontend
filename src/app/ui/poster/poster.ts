import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { episodeCode } from '../../shared/episode-code';
import { Icon } from '../icon/icon';

export type PosterStatus = 'watchlist' | 'seen';

export interface PosterEpisode {
  readonly season: number;
  readonly episode: number;
}

export interface PosterProgress {
  readonly seen: number;
  readonly total: number;
}

const STATUS_LABELS: Record<PosterStatus, string> = { watchlist: 'Watchlist', seen: 'Vu' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-poster',
  imports: [Icon],
  template: `
    <div class="zb-poster">
      <div class="zb-poster-frame">
        @if (status(); as status) {
          <span class="zb-poster-badge">
            <span [class]="'zb-badge zb-badge-' + status">
              <svg appIcon [name]="status"></svg>{{ statusLabels[status] }}
            </span>
          </span>
        } @else if (progress()) {
          <span class="zb-poster-badge"
            ><span class="zb-badge zb-badge-progress">En cours</span></span
          >
        }
        <span class="zb-poster-caption">
          <span class="zb-poster-title">{{ title() }}</span>
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

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly code = computed(() => {
    const next = this.next();
    return next && episodeCode(next.season, next.episode);
  });
}
