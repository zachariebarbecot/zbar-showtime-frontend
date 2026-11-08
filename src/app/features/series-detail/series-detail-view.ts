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
  readonly year?: string;
  readonly counts?: string;
  readonly status?: ShowStatusValue;
  readonly genres: readonly string[];
  readonly overview?: string;
  readonly creators: readonly string[];
  readonly cast: readonly CastMemberView[];
  readonly watchlist?: WatchlistBadgeStatus;
  readonly seasons: readonly Season[];
}

export const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`;

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
  creators,
  cast,
  watchlistStatus,
  seasons,
}: SeriesDetailResponse): SeriesDetailView => ({
  name,
  originalName: originalName === name ? undefined : originalName,
  posterUrl,
  year: firstAirDate?.slice(0, 4),
  counts:
    [
      numberOfSeasons ? plural(numberOfSeasons, 'saison') : undefined,
      numberOfEpisodes ? plural(numberOfEpisodes, 'épisode') : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  status: isShowStatus(status) ? status : undefined,
  genres: genres ?? [],
  overview,
  creators: creators ?? [],
  cast: toCastMemberViews(cast),
  watchlist: toBadgeStatus(watchlistStatus),
  seasons: seasons ?? [],
});
