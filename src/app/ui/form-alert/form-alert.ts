import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-alert',
  template: `<div class="form-alert" role="alert">{{ message() }}</div>`,
  styles: `
    .form-alert {
      display: flex;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px solid var(--danger);
      border-radius: var(--radius-sm);
      color: var(--danger);
      font: 400 14px/20px var(--font-sans);
    }
  `,
})
export class FormAlert {
  readonly message = input.required<string>();
}
