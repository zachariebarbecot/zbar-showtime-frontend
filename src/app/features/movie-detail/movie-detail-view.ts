import { MovieDetailResponse } from '../../api/models/movie-detail-response';

export interface CastMemberView {
  readonly name: string;
  readonly character: string;
  readonly photoUrl?: string;
}
import { toBadgeStatus } from '../../shared/watchlist-status';
import { WatchlistBadgeStatus } from '../../ui/status-badge/status-badge';

export interface MovieDetailView {
  readonly title?: string;
  readonly originalTitle?: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly genres: readonly string[];
  readonly overview?: string;
  readonly directors: readonly string[];
  readonly cast: readonly CastMemberView[];
  readonly status?: WatchlistBadgeStatus;
}

export const toMovieDetailView = ({
  title,
  originalTitle,
  posterUrl,
  releaseDate,
  runtime,
  genres,
  overview,
  directors,
  cast,
  watchlistStatus,
}: MovieDetailResponse): MovieDetailView => ({
  title,
  originalTitle: originalTitle === title ? undefined : originalTitle,
  posterUrl,
  meta:
    [releaseDate?.slice(0, 4), runtime ? `${runtime} min` : undefined]
      .filter(Boolean)
      .join(' · ') || undefined,
  genres: genres ?? [],
  overview,
  directors: directors ?? [],
  cast: (cast ?? []).flatMap(({ name, character, photoUrl }) =>
    name ? [{ name, character: character ?? '', photoUrl }] : [],
  ),
  status: toBadgeStatus(watchlistStatus),
});
