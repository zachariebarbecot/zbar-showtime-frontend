import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-season',
  template: '',
})
export class Season {
  readonly title = input<string>();
  readonly info = input<string>();
  readonly expanded = model(false);
}
