import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PosterStatus = 'watchlist' | 'seen';

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
  template: '',
})
export class Poster {
  readonly title = input.required<string>();
  readonly status = input<PosterStatus>();
  readonly next = input<PosterEpisode>();
  readonly progress = input<PosterProgress>();
}
