import { ValidationErrors, ValidatorFn } from '@angular/forms';

/** Reports a blank value as `required`, like an empty one. */
export const notBlank: ValidatorFn = (control): ValidationErrors | null =>
  String(control.value).trim() === '' ? { required: true } : null;
