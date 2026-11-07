import { SeriesDetailResponse } from '../../api/models/series-detail-response';

export interface SeriesDetailView {
  readonly name?: string;
  readonly originalName?: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly genres: readonly string[];
  readonly overview?: string;
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

export const toSeriesDetailView = ({
  name,
  originalName,
  posterUrl,
  numberOfSeasons,
  numberOfEpisodes,
  genres,
  overview,
}: SeriesDetailResponse): SeriesDetailView => ({
  name,
  originalName: originalName === name ? undefined : originalName,
  posterUrl,
  meta:
    [
      numberOfSeasons ? plural(numberOfSeasons, 'saison') : undefined,
      numberOfEpisodes ? plural(numberOfEpisodes, 'épisode') : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  genres: genres ?? [],
  overview,
});
