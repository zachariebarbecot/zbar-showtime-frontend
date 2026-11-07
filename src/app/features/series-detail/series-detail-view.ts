import { SeriesDetailResponse } from '../../api/models/series-detail-response';
import { ShowStatusValue, isShowStatus } from '../../ui/show-status/show-status';

export interface SeriesDetailView {
  readonly name?: string;
  readonly originalName?: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly status?: ShowStatusValue;
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
  status,
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
  status: isShowStatus(status) ? status : undefined,
  genres: genres ?? [],
  overview,
});
