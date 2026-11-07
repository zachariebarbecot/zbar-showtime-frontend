import { WatchlistBadgeStatus } from '../ui/status-badge/status-badge';

const STATUSES = new Map<string, WatchlistBadgeStatus>([
  ['TO_WATCH', 'watchlist'],
  ['WATCHED', 'seen'],
  ['WATCHING', 'progress'],
  ['DROPPED', 'dropped'],
]);

export const toBadgeStatus = (watchlistStatus?: string): WatchlistBadgeStatus | undefined =>
  STATUSES.get(watchlistStatus ?? '');
