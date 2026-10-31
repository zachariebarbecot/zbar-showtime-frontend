import { FormGroup } from '@angular/forms';

export function invalidSummary(form: FormGroup): string {
  const count = Object.values(form.controls).filter((control) => control.invalid).length;
  return count === 1 ? '1 champ est à corriger.' : `${count} champs sont à corriger.`;
}

export function focusFirstInvalid(form: FormGroup, root: HTMLElement): void {
  const fields = root.querySelectorAll<HTMLElement>(
    'input[name], select[name], textarea[name], [role="radiogroup"][data-name]',
  );
  const invalid = Array.from(fields).find((field) => form.get(fieldName(field))?.invalid);
  const target = invalid?.matches('[role="radiogroup"]')
    ? invalid.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')
    : invalid;
  target?.focus();
}

function fieldName(field: HTMLElement): string {
  return field.getAttribute('name') ?? field.dataset['name'] ?? '';
}
