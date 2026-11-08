import { toBadgeStatus } from '../../shared/watchlist-status';
import { WatchlistBadgeStatus } from '../../ui/status-badge/status-badge';
import { Season } from '../../api/models/season';
import { SeriesDetailResponse } from '../../api/models/series-detail-response';
import { ShowStatusValue, isShowStatus } from '../../ui/show-status/show-status';
import { CastMemberView, toCastMemberViews } from '../../shared/cast-member-view';

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
  readonly watchlist?: WatchlistBadgeStatus;
  readonly seasons: readonly Season[];
  readonly watchedEpisodes: number;
  readonly totalEpisodes: number;
}

export const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

export const withProgress = (
  meta: string | undefined,
  watched: number,
  total: number,
  watchlisted: boolean,
) =>
  [meta, watchlisted && total > 0 ? `${watched} / ${total} épisodes vus` : undefined]
    .filter(Boolean)
    .join(' · ');

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
  watchlistStatus,
  seasons,
  watchedEpisodes,
  totalEpisodes,
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
  cast: toCastMemberViews(cast),
  watchlist: toBadgeStatus(watchlistStatus),
  seasons: seasons ?? [],
  watchedEpisodes: watchedEpisodes ?? 0,
  totalEpisodes: totalEpisodes ?? 0,
});
