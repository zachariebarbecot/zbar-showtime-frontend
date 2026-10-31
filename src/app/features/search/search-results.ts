import { Result } from '../../api/models/result';
import { SearchResponse } from '../../api/models/search-response';

export interface SearchItem {
  readonly id: number;
  readonly title: string;
  readonly posterUrl?: string;
  readonly meta: string;
}

export interface SearchResults {
  readonly total: number;
  readonly items: readonly SearchItem[];
}

const KIND_LABELS: Record<NonNullable<Result['type']>, string> = { MOVIE: 'Film', TV: 'Série' };

const toItem = ({ id, title, posterUrl, releaseDate, type }: Result): SearchItem[] =>
  id === undefined || title === undefined
    ? []
    : [
        {
          id,
          title,
          posterUrl,
          meta: [type && KIND_LABELS[type], releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
        },
      ];

export const toSearchResults = (response: SearchResponse): SearchResults => {
  const items = (response.results ?? []).flatMap(toItem);
  return { total: response.totalResults ?? items.length, items };
};
