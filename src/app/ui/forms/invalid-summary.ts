import { FormGroup } from '@angular/forms';

export function invalidSummary(form: FormGroup): string {
  const count = Object.values(form.controls).filter((control) => control.invalid).length;
  return count === 1 ? '1 champ est à corriger.' : `${count} champs sont à corriger.`;
}

export function focusFirstInvalid(form: FormGroup, root: HTMLElement): void {
  Array.from(root.querySelectorAll<HTMLElement>('input[name], select[name], textarea[name]'))
    .find((field) => form.get(field.getAttribute('name') ?? '')?.invalid)
    ?.focus();
}
