import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-alert',
  template: '',
})
export class FormAlert {
  readonly message = input.required<string>();
}
