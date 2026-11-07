import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Season as SeasonResponse } from '../../api/models/season';
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { Season } from '../../ui/season/season';
import { plural } from './series-detail-view';

const rank = (seasonNumber: number) => (seasonNumber === 0 ? Infinity : seasonNumber);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-seasons',
  imports: [Season],
  template: `
    <section class="md-seasons">
      <h2 class="zb-car-title">Saisons</h2>
      <div class="md-seasons-list">
        @for (season of sorted(); track season.number; let first = $first) {
          <app-season
            [title]="season.title"
            [info]="season.info"
            [expanded]="first"
            (expandedChange)="onExpandedChange($event, season.number)"
          />
        }
      </div>
    </section>
  `,
})
export class SeriesSeasons {
  readonly tmdbId = input.required<number>();
  readonly seasons = input.required<readonly SeasonResponse[]>();

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

  private readonly api = inject(SeriesControllerService);
  private readonly requested = new Set<number>();

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
    this.api.season({ tmdbId: this.tmdbId(), seasonNumber }).subscribe();
  }
}
