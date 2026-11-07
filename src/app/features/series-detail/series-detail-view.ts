import { SeriesDetailResponse } from '../../api/models/series-detail-response';

export interface SeriesDetailView {
  readonly name?: string;
  readonly originalName?: string;
  readonly posterUrl?: string;
  readonly genres: readonly string[];
  readonly overview?: string;
}

export const toSeriesDetailView = ({
  name,
  originalName,
  posterUrl,
  genres,
  overview,
}: SeriesDetailResponse): SeriesDetailView => ({
  name,
  originalName: originalName === name ? undefined : originalName,
  posterUrl,
  genres: genres ?? [],
  overview,
});
