import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-people-section',
  template: `
    @if (names().length) {
      <section class="md-directors">
        <h2 class="zb-car-title">{{ title() }}</h2>
        <ul class="md-people">
          @for (name of names(); track name) {
            <li>{{ name }}</li>
          }
        </ul>
      </section>
    }
  `,
  host: { style: 'display: contents' },
})
export class PeopleSection {
  readonly title = input.required<string>();
  readonly names = input.required<readonly string[]>();
}
