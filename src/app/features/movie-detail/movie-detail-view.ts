import { MovieDetailResponse } from '../../api/models/movie-detail-response';

export interface MovieDetailView {
  readonly title?: string;
  readonly originalTitle?: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly genres: readonly string[];
  readonly overview?: string;
  readonly directors: readonly string[];
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
});
