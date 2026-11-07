import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Season } from '../../api/models/season';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-seasons',
  template: '',
})
export class SeriesSeasons {
  readonly tmdbId = input.required<number>();
  readonly seasons = input.required<readonly Season[]>();
}
