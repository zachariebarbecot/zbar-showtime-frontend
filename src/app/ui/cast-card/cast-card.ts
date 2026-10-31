import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cast-card',
  template: `
    <div class="zb-cast">
      <div class="zb-cast-photo">{{ initials() }}</div>
      <div>
        <div class="zb-cast-name">{{ name() }}</div>
        <div class="zb-cast-role">{{ character() }}</div>
      </div>
    </div>
  `,
  host: { style: 'display: contents' },
})
export class CastCard {
  readonly name = input.required<string>();
  readonly character = input.required<string>();

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
