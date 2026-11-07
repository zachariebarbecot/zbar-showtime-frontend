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
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { EpisodeRow } from '../../ui/episode-row/episode-row';
import { Season } from '../../ui/season/season';
import { plural } from './series-detail-view';

interface Episode {
  number: number;
  title: string;
  runtime?: number;
}

const rank = (seasonNumber: number) => (seasonNumber === 0 ? Infinity : seasonNumber);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-seasons',
  imports: [EpisodeRow, Season],
  template: `
    @if (sorted().length) {
      <section class="md-seasons">
        <h2 class="zb-car-title">Saisons</h2>
        <div class="md-seasons-list">
          @for (season of sorted(); track season.number; let first = $first) {
            <app-season
              [title]="season.title"
              [info]="season.info"
              [expanded]="first"
              (expandedChange)="onExpandedChange($event, season.number)"
            >
              @if (episodes()[season.number]; as episodes) {
                @for (episode of episodes; track episode.number) {
                  <app-episode-row
                    [season]="season.number"
                    [episode]="episode.number"
                    [title]="episode.title"
                    [runtime]="episode.runtime"
                  />
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

  protected readonly episodes = signal<Record<number, readonly Episode[] | undefined>>({});

  protected readonly sorted = computed(() =>
    this.seasons()
      .flatMap(({ seasonNumber, name, episodeCount }) =>
        seasonNumber === undefined
          ? []
          : [
              {
                number: seasonNumber,
                title: seasonNumber === 0 ? 'Épisodes spéciaux' : name,
                info: episodeCount ? plural(episodeCount, 'épisode') : undefined,
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

  private load(seasonNumber: number) {
    if (this.requested.has(seasonNumber)) return;
    this.requested.add(seasonNumber);
    this.api
      .season({ tmdbId: this.tmdbId(), seasonNumber })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((season) => {
        const episodes = (season.episodes ?? [])
          .flatMap(({ episodeNumber, name, runtime }) =>
            episodeNumber === undefined
              ? []
              : [{ number: episodeNumber, title: name ?? '', runtime }],
          )
          .sort((a, b) => a.number - b.number);
        this.episodes.update((all) => ({ ...all, [seasonNumber]: episodes }));
      });
  }
}
