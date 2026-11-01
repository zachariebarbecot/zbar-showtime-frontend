import { Result } from '../../api/models/result';
import { SearchResponse } from '../../api/models/search-response';
import { PosterStatus } from '../../ui/poster/poster';

export interface SearchItem {
  readonly key: string;
  readonly title: string;
  readonly posterUrl?: string;
  readonly meta?: string;
  readonly status?: PosterStatus;
}

export interface SearchResults {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly items: readonly SearchItem[];
}

const STATUSES = new Map<string, PosterStatus>([
  ['TO_WATCH', 'watchlist'],
  ['WATCHED', 'seen'],
  ['WATCHING', 'progress'],
  ['DROPPED', 'dropped'],
]);

const toItem = ({
  id,
  title,
  posterUrl,
  releaseDate,
  type,
  watchlistStatus,
}: Result): SearchItem[] =>
  id === undefined || title === undefined
    ? []
    : [
        {
          key: `${type}:${id}`,
          title,
          posterUrl,
          meta: releaseDate?.slice(0, 4),
          status: STATUSES.get(watchlistStatus ?? ''),
        },
      ];

export const toSearchResults = (response: SearchResponse): SearchResults => {
  const items = (response.results ?? []).flatMap(toItem);
  return {
    page: response.page ?? 1,
    totalPages: response.totalPages ?? 1,
    total: response.totalResults ?? items.length,
    items,
  };
};

export const appendItems = (
  shown: readonly SearchItem[],
  incoming: readonly SearchItem[],
): readonly SearchItem[] => {
  const keys = new Set(shown.map(({ key }) => key));
  return [...shown, ...incoming.filter(({ key }) => !keys.has(key))];
};
