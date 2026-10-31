import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cast-card',
  template: '',
})
export class CastCard {
  readonly name = input.required<string>();
  readonly character = input.required<string>();
}
