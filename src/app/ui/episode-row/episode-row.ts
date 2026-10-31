import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-episode-row',
  template: '',
})
export class EpisodeRow {
  readonly season = input.required<number>();
  readonly episode = input.required<number>();
  readonly title = input.required<string>();
  readonly runtime = input.required<number>();
  readonly seen = model(false);
}
