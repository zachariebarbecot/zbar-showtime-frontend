import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-season',
  imports: [Icon],
  template: `
    <section class="zb-season" [class.zb-season-open]="expanded()">
      <div class="zb-season-head">
        <button type="button" class="zb-season-toggle">
          <svg appIcon name="down"></svg>
          <span class="zb-season-title">{{ title() }}</span>
          <span class="zb-meta zb-season-info">{{ info() }}</span>
        </button>
      </div>
    </section>
  `,
  host: { style: 'display: contents' },
})
export class Season {
  readonly title = input<string>();
  readonly info = input<string>();
  readonly expanded = model(false);
}
