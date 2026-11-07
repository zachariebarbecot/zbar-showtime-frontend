import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Season as SeasonResponse } from '../../api/models/season';
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
        @for (season of sorted(); track season.number) {
          <app-season [title]="season.title" [info]="season.info" />
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
                title: name,
                info: episodeCount ? plural(episodeCount, 'épisode') : undefined,
              },
            ],
      )
      .sort((a, b) => rank(a.number) - rank(b.number)),
  );
}
