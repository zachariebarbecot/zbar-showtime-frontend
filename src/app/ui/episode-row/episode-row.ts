import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

const pad = (n: number): string => String(n).padStart(2, '0');

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-episode-row',
  imports: [Icon],
  template: `
    <div class="zb-ep" [class.zb-ep-seen]="seen()">
      <span class="zb-meta">{{ code() }}</span>
      <div>
        <div class="zb-ep-title">{{ title() }}</div>
        <div class="zb-meta">{{ runtime() }} min</div>
      </div>
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
    </div>
  `,
  host: { style: 'display: contents' },
})
export class EpisodeRow {
  readonly season = input.required<number>();
  readonly episode = input.required<number>();
  readonly title = input.required<string>();
  readonly runtime = input.required<number>();
  readonly seen = model(false);

  protected readonly code = computed(() => `S${pad(this.season())}E${pad(this.episode())}`);
}
