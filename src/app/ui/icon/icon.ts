import { Component, input } from '@angular/core';

export type IconName = 'eye';

@Component({
  selector: 'svg[appIcon]',
  template: '',
})
export class Icon {
  readonly name = input.required<IconName>();
}
