import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { episodeCode } from '../../shared/episode-code';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-episode-row',
  imports: [Icon],
  template: `
    <div class="zb-ep" [class.zb-ep-seen]="seen()" [class.zb-ep-still]="still() !== undefined">
      @if (still() === undefined) {
        <span class="zb-meta">{{ code() }}</span>
      } @else {
        <div class="zb-ep-thumb">
          @if (still()) {
            <img [src]="still()" alt="" loading="lazy" />
          }
          <span class="zb-ep-code">{{ code() }}</span>
        </div>
      }
      <div [class.zb-ep-info]="still() !== undefined">
        <div class="zb-ep-title">{{ title() }}</div>
        @if (meta()) {
          <div class="zb-meta">{{ meta() }}</div>
        }
        @if (overview()) {
          <p class="zb-ep-overview">{{ overview() }}</p>
        }
      </div>
      @if (showCheck()) {
        <button
          type="button"
          role="checkbox"
          class="zb-check"
          [attr.aria-checked]="seen()"
          [attr.aria-label]="(seen() ? 'Vu : ' : 'Marquer vu : ') + code()"
          (click)="seen.set(!seen())"
        >
          <svg appIcon name="seen"></svg>
        </button>
      }
    </div>
  `,
  host: { style: 'display: contents' },
})
export class EpisodeRow {
  readonly season = input.required<number>();
  readonly episode = input.required<number>();
  readonly title = input.required<string>();
  readonly runtime = input<number>();
  readonly still = input<string | null>();
  readonly airDate = input<string>();
  readonly overview = input<string>();
  readonly showCheck = input(true);
  readonly seen = model(false);

  protected readonly meta = computed(() =>
    [this.runtime() ? `${this.runtime()} min` : undefined, this.airDate()]
      .filter(Boolean)
      .join(' · '),
  );
  protected readonly code = computed(() => episodeCode(this.season(), this.episode()));
}
