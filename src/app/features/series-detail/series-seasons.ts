import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Season as SeasonResponse } from '../../api/models/season';
import { SeasonDetailResponse } from '../../api/models/season-detail-response';
import { WatchlistControllerService } from '../../api/services/watchlist-controller.service';
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { Button } from '../../ui/button/button';
import { EpisodeRow } from '../../ui/episode-row/episode-row';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { Season } from '../../ui/season/season';
import { StatusButton } from '../../ui/status-button/status-button';
import { plural } from './series-detail-view';

interface Episode {
  number: number;
  title: string;
  runtime?: number;
  overview?: string;
  airDate?: string;
  aired: boolean;
  still?: string | null;
  watched: boolean;
  locked: boolean;
}

interface Loaded {
  updateFailed: boolean;
  overview?: string;
  episodes: readonly Episode[];
}

type EpisodesState = Loaded | 'failed' | undefined;

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const tmdbSize = (url: string, size: string) => url.replace(/\/w\d+\//, `/${size}/`);

const toStill = (stillUrl: string | undefined, seasonHasStill: boolean) => {
  if (stillUrl) return tmdbSize(stillUrl, 'w300');
  return seasonHasStill ? null : undefined;
};

const toLoaded = ({ overview, episodes = [] }: SeasonDetailResponse): Loaded => {
  const today = new Date().toISOString().slice(0, 10);
  const hasStill = episodes.some(({ stillUrl }) => stillUrl);
  return {
    overview,
    updateFailed: false,
    episodes: episodes
      .flatMap(({ episodeNumber, name, runtime, overview, airDate, stillUrl, watched }) =>
        episodeNumber === undefined
          ? []
          : [
              {
                number: episodeNumber,
                title: name ?? '',
                runtime,
                overview,
                airDate: airDate && formatDate(airDate),
                aired: !!airDate && airDate <= today,
                still: toStill(stillUrl, hasStill),
                watched: watched ?? false,
                locked: false,
              },
            ],
      )
      .sort((a, b) => a.number - b.number),
  };
};

const rank = (seasonNumber: number) => (seasonNumber === 0 ? Infinity : seasonNumber);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-seasons',
  imports: [Button, EpisodeRow, FormAlert, Season, StatusButton],
  template: `
    @if (sorted().length) {
      <section class="md-seasons">
        <h2 class="zb-car-title">Saisons</h2>
        <div class="md-seasons-list">
          @for (season of sorted(); track season.number; let first = $first) {
            @let progress = progressOf(season.number);
            @let aired = airedEpisodes(season.number);
            @let allSeen = isAllSeen(aired);
            <app-season
              [title]="season.title"
              [info]="season.info"
              [poster]="season.poster"
              [seen]="progress?.seen ?? null"
              [total]="progress?.total ?? null"
              [expanded]="first"
              (expandedChange)="onExpandedChange($event, season.number)"
            >
              @if (watchlisted() && aired.length) {
                <app-status-button
                  seasonAction
                  kind="seen"
                  size="sm"
                  [controlled]="true"
                  [active]="allSeen"
                  [ariaLabel]="(allSeen ? 'Vu : ' : 'Marquer vu : ') + season.title"
                  [locked]="isUpdating(aired)"
                  (add)="markSeason(season.number)"
                />
              }
              @let state = episodes()[season.number];
              @if (state === 'failed') {
                <app-form-alert message="Impossible de charger les épisodes de cette saison." />
                <app-button variant="secondary" (click)="retry(season.number)"
                  >Réessayer</app-button
                >
              } @else if (state) {
                @if (state.overview) {
                  <p class="zb-season-overview">{{ state.overview }}</p>
                }
                @if (state.updateFailed) {
                  <app-form-alert
                    message="Impossible de mettre à jour l'épisode. Réessaie dans un instant."
                  />
                }
                @for (episode of state.episodes; track episode.number) {
                  <app-episode-row
                    [season]="season.number"
                    [episode]="episode.number"
                    [title]="episode.title"
                    [runtime]="episode.runtime"
                    [still]="episode.still"
                    [overview]="episode.overview"
                    [airDate]="episode.airDate"
                    [showCheck]="watchlisted() && episode.aired"
                    [seen]="episode.watched"
                    [locked]="episode.locked"
                    (seenChange)="toggle(season.number, episode.number, $event)"
                  />
                } @empty {
                  <p>Aucun épisode pour cette saison</p>
                }
              } @else {
                <p role="status">Chargement…</p>
              }
            </app-season>
          }
        </div>
      </section>
    }
  `,
})
export class SeriesSeasons {
  readonly tmdbId = input.required<number>();
  readonly seasons = input.required<readonly SeasonResponse[]>();
  readonly watchlisted = input(false);

  private readonly api = inject(SeriesControllerService);
  private readonly watchlistApi = inject(WatchlistControllerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requested = new Set<number>();

  protected readonly episodes = signal<Record<number, EpisodesState>>({});

  protected readonly sorted = computed(() =>
    this.seasons()
      .flatMap(({ seasonNumber, name, episodeCount, airDate, posterUrl }) =>
        seasonNumber === undefined
          ? []
          : [
              {
                number: seasonNumber,
                title: seasonNumber === 0 ? 'Épisodes spéciaux' : name,
                info: [
                  episodeCount ? plural(episodeCount, 'épisode') : undefined,
                  airDate?.slice(0, 4),
                ]
                  .filter(Boolean)
                  .join(' · '),
                poster: posterUrl && tmdbSize(posterUrl, 'w92'),
              },
            ],
      )
      .sort((a, b) => rank(a.number) - rank(b.number)),
  );

  constructor() {
    effect(() => {
      const [first] = this.sorted();
      if (first) this.load(first.number);
    });
  }

  protected onExpandedChange(expanded: boolean, seasonNumber: number) {
    if (expanded) this.load(seasonNumber);
  }

  private loaded(seasonNumber: number) {
    const state = this.episodes()[seasonNumber];
    return state === 'failed' ? undefined : state;
  }

  protected progressOf(seasonNumber: number) {
    const state = this.loaded(seasonNumber);
    if (!this.watchlisted() || !state) return undefined;
    return {
      seen: state.episodes.filter(({ watched }) => watched).length,
      total: state.episodes.length,
    };
  }

  protected airedEpisodes(seasonNumber: number) {
    return this.loaded(seasonNumber)?.episodes.filter(({ aired }) => aired) ?? [];
  }

  protected isAllSeen(aired: readonly Episode[]) {
    return aired.every(({ watched }) => watched);
  }

  protected isUpdating(aired: readonly Episode[]) {
    return aired.some(({ locked }) => locked);
  }

  protected markSeason(seasonNumber: number) {
    const aired = this.airedEpisodes(seasonNumber);
    const target = !this.isAllSeen(aired);
    for (const { number, watched } of aired) {
      if (watched !== target) this.toggle(seasonNumber, number, target);
    }
  }

  protected retry(seasonNumber: number) {
    this.setState(seasonNumber, undefined);
    this.fetch(seasonNumber);
  }

  protected toggle(seasonNumber: number, episodeNumber: number, watched: boolean) {
    this.patchSeason(seasonNumber, { updateFailed: false });
    this.patch(seasonNumber, episodeNumber, { watched, locked: true });
    const params = { tmdbId: this.tmdbId(), seasonNumber, episodeNumber };
    (watched
      ? this.watchlistApi.markEpisodeWatched(params)
      : this.watchlistApi.unmarkEpisodeWatched(params)
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.patch(seasonNumber, episodeNumber, { locked: false });
        },
        error: () => {
          this.patch(seasonNumber, episodeNumber, { watched: !watched, locked: false });
          this.patchSeason(seasonNumber, { updateFailed: true });
        },
      });
  }

  private patch(seasonNumber: number, episodeNumber: number, change: Partial<Episode>) {
    this.episodes.update((all) => {
      const state = all[seasonNumber];
      if (!state || state === 'failed') return all;
      return {
        ...all,
        [seasonNumber]: {
          ...state,
          episodes: state.episodes.map((episode) =>
            episode.number === episodeNumber ? { ...episode, ...change } : episode,
          ),
        },
      };
    });
  }

  private patchSeason(seasonNumber: number, change: Partial<Loaded>) {
    this.episodes.update((all) => {
      const state = all[seasonNumber];
      if (!state || state === 'failed') return all;
      return { ...all, [seasonNumber]: { ...state, ...change } };
    });
  }

  private load(seasonNumber: number) {
    if (this.requested.has(seasonNumber)) return;
    this.requested.add(seasonNumber);
    this.fetch(seasonNumber);
  }

  private fetch(seasonNumber: number) {
    this.api
      .season({ tmdbId: this.tmdbId(), seasonNumber })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (season) => this.setState(seasonNumber, toLoaded(season)),
        error: () => this.setState(seasonNumber, 'failed'),
      });
  }

  private setState(seasonNumber: number, state: EpisodesState) {
    this.episodes.update((all) => ({ ...all, [seasonNumber]: state }));
  }
}
