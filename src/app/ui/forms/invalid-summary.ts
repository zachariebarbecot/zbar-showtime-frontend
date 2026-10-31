import { FormGroup } from '@angular/forms';

export function invalidSummary(form: FormGroup): string {
  return '';
}

export function focusFirstInvalid(form: FormGroup, root: HTMLElement): void {}
