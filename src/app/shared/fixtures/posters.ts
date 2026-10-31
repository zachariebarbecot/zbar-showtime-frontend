import { PosterEpisode, PosterProgress, PosterStatus } from '../../ui/poster/poster';

export interface PosterFixture {
  readonly title: string;
  readonly status?: PosterStatus;
  readonly next?: PosterEpisode;
  readonly progress?: PosterProgress;
}

export const POSTER_WALL: readonly (readonly PosterFixture[])[] = [
  [
    { title: 'Dune : Deuxième partie', status: 'seen' },
    { title: 'Severance', next: { season: 2, episode: 4 }, progress: { seen: 12, total: 19 } },
    { title: 'Past Lives' },
  ],
  [
    { title: 'Anatomie d’une chute', status: 'watchlist' },
    { title: 'The Bear', next: { season: 3, episode: 7 }, progress: { seen: 24, total: 38 } },
    { title: 'Le Règne animal', status: 'seen' },
    { title: 'Shōgun' },
  ],
  [
    { title: 'Slow Horses', status: 'watchlist' },
    { title: 'Les Herbes sèches' },
    { title: 'Andor', next: { season: 2, episode: 1 }, progress: { seen: 12, total: 24 } },
  ],
  [
    { title: 'Fleabag', status: 'seen' },
    { title: 'Dark', next: { season: 2, episode: 3 }, progress: { seen: 12, total: 26 } },
  ],
];
