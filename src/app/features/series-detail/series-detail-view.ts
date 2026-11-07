import { CastMemberView } from '../movie-detail/movie-detail-view';
import { SeriesDetailResponse } from '../../api/models/series-detail-response';
import { ShowStatusValue, isShowStatus } from '../../ui/show-status/show-status';

export interface SeriesDetailView {
  readonly name?: string;
  readonly originalName?: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly status?: ShowStatusValue;
  readonly period?: string;
  readonly genres: readonly string[];
  readonly overview?: string;
  readonly creators: readonly string[];
  readonly cast: readonly CastMemberView[];
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

const year = (date: string) => date.slice(0, 4);

const toPeriod = (status: string | undefined, firstAirDate: string, lastAirDate?: string) => {
  const from = year(firstAirDate);
  if (status !== 'ENDED' && status !== 'CANCELED') return `${from} –`;
  const to = lastAirDate && year(lastAirDate);
  return to && to !== from ? `${from}–${to}` : from;
};

export const toSeriesDetailView = ({
  name,
  originalName,
  posterUrl,
  numberOfSeasons,
  numberOfEpisodes,
  genres,
  overview,
  status,
  firstAirDate,
  lastAirDate,
  creators,
  cast,
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
  period: firstAirDate ? toPeriod(status, firstAirDate, lastAirDate) : undefined,
  genres: genres ?? [],
  overview,
  creators: creators ?? [],
  cast: (cast ?? []).flatMap(({ name, character, photoUrl }) =>
    name ? [{ name, character: character ?? '', photoUrl }] : [],
  ),
});
