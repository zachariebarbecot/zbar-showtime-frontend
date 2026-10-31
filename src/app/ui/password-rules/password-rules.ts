import { Component, input } from '@angular/core';

@Component({
  selector: 'app-password-rules',
  template: '',
})
export class PasswordRules {
  readonly id = input.required<string>();
  readonly value = input.required<string>();
  readonly showErrors = input(false);
}
