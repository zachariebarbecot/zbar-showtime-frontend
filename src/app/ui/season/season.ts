import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-season',
  imports: [Icon],
  template: `
    <section class="zb-season" [class.zb-season-open]="expanded()">
      <div class="zb-season-head">
        <button
          type="button"
          class="zb-season-toggle"
          [attr.aria-expanded]="expanded()"
          [attr.aria-controls]="bodyId"
          (click)="expanded.set(!expanded())"
        >
          <svg appIcon name="down"></svg>
          <span class="zb-season-poster">
            @if (poster(); as poster) {
              <img [src]="poster" alt="" loading="lazy" />
            }
          </span>
          <span class="zb-season-label">
            <span class="zb-season-title">{{ title() }}</span>
            <span class="zb-meta zb-season-info">{{ info() }}</span>
          </span>
        </button>
        @if (percent() !== null) {
          <span class="zb-meta">{{ seen() }}/{{ total() }}</span>
        }
      </div>
      @if (percent() !== null) {
        <div class="zb-season-bar" aria-hidden="true">
          <span [style.width.%]="percent()"></span>
        </div>
      }
      <div class="zb-season-body" [id]="bodyId" [hidden]="!expanded()">
        <ng-content />
      </div>
    </section>
  `,
  host: { style: 'display: contents' },
})
export class Season {
  readonly title = input<string>();
  readonly info = input<string>();
  readonly poster = input<string>();
  readonly seen = input<number | null>(null);
  readonly total = input<number | null>(null);
  readonly expanded = model(false);

  protected readonly percent = computed(() => {
    const [seen, total] = [this.seen(), this.total()];
    if (seen === null || total === null) return null;
    return total ? (seen / total) * 100 : 0;
  });

  protected readonly bodyId = `app-season-body-${nextId++}`;
}
