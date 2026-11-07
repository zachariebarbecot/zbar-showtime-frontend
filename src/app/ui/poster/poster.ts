import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { episodeCode } from '../../shared/episode-code';
import { StatusBadge, WatchlistBadgeStatus } from '../status-badge/status-badge';

export type PosterStatus = WatchlistBadgeStatus;

export interface PosterEpisode {
  readonly season: number;
  readonly episode: number;
}

export interface PosterProgress {
  readonly seen: number;
  readonly total: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-poster',
  imports: [RouterLink, StatusBadge],
  template: `
    <div class="zb-poster">
      <div class="zb-poster-frame">
        @if (src(); as src) {
          <img [src]="src" alt="" />
        }
        @if (badge(); as badge) {
          <span class="zb-poster-badge">
            <app-status-badge [status]="badge" />
          </span>
        }
        <span class="zb-poster-action"><ng-content /></span>
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
        @if (link(); as link) {
          <a class="zb-poster-link" [routerLink]="link" [attr.aria-label]="title()"></a>
        }
      </div>
    </div>
  `,
  host: { style: 'display: contents' },
})
export class Poster {
  readonly title = input.required<string>();
  readonly src = input<string>();
  readonly link = input<string>();
  readonly meta = input<string>();
  readonly status = input<PosterStatus>();
  readonly next = input<PosterEpisode>();
  readonly progress = input<PosterProgress>();

  protected readonly badge = computed<PosterStatus | undefined>(
    () => this.status() ?? (this.progress() ? 'progress' : undefined),
  );
  protected readonly code = computed(() => {
    const next = this.next();
    return next && episodeCode(next.season, next.episode);
  });
}
