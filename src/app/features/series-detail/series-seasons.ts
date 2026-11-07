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
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { Button } from '../../ui/button/button';
import { EpisodeRow } from '../../ui/episode-row/episode-row';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { Season } from '../../ui/season/season';
import { plural } from './series-detail-view';

interface Episode {
  number: number;
  title: string;
  runtime?: number;
  overview?: string;
  airDate?: string;
  still?: string | null;
}

interface Loaded {
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

const toStill = (stillUrl: string | undefined, seasonHasStill: boolean) => {
  if (stillUrl) return stillUrl.replace(/\/w\d+\//, '/w300/');
  return seasonHasStill ? null : undefined;
};

const toLoaded = ({ overview, episodes = [] }: SeasonDetailResponse): Loaded => {
  const hasStill = episodes.some(({ stillUrl }) => stillUrl);
  return {
    overview,
    episodes: episodes
      .flatMap(({ episodeNumber, name, runtime, overview, airDate, stillUrl }) =>
        episodeNumber === undefined
          ? []
          : [
              {
                number: episodeNumber,
                title: name ?? '',
                runtime,
                overview,
                airDate: airDate && formatDate(airDate),
                still: toStill(stillUrl, hasStill),
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
  imports: [Button, EpisodeRow, FormAlert, Season],
  template: `
    @if (sorted().length) {
      <section class="md-seasons">
        <h2 class="zb-car-title">Saisons</h2>
        <div class="md-seasons-list">
          @for (season of sorted(); track season.number; let first = $first) {
            <app-season
              [title]="season.title"
              [info]="season.info"
              [poster]="season.poster"
              [expanded]="first"
              (expandedChange)="onExpandedChange($event, season.number)"
            >
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
                @for (episode of state.episodes; track episode.number) {
                  <app-episode-row
                    [season]="season.number"
                    [episode]="episode.number"
                    [title]="episode.title"
                    [runtime]="episode.runtime"
                    [still]="episode.still"
                    [overview]="episode.overview"
                    [airDate]="episode.airDate"
                    [showCheck]="false"
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

  private readonly api = inject(SeriesControllerService);
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
                poster: posterUrl?.replace(/\/w\d+\//, '/w92/'),
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

  protected retry(seasonNumber: number) {
    this.setState(seasonNumber, undefined);
    this.fetch(seasonNumber);
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
