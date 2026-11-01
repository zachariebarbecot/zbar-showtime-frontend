import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-empty-state',
  template: `
    <div class="zb-empty">
      <h2 class="zb-empty-title">{{ title() }}</h2>
      @if (text()) {
        <p class="zb-empty-text">{{ text() }}</p>
      }
      <ng-content />
    </div>
  `,
  host: { style: 'display: contents' },
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly text = input<string>();
}
