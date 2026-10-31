import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { passwordChecks } from '../../ui/forms/password-checks';

/** Reports a blank value as `required`, like an empty one. */
export const notBlank: ValidatorFn = (control): ValidationErrors | null =>
  String(control.value).trim() === '' ? { required: true } : null;

export const passwordRules: ValidatorFn = (control): ValidationErrors | null =>
  passwordChecks(String(control.value)).every((check) => check.ok) ? null : { rules: true };

/** Refuses a value holding the email of `email`, ignoring the case. Invalid email: nothing to hold. */
export function withoutEmail(email: AbstractControl): ValidatorFn {
  return (control) =>
    email.valid && String(control.value).toLowerCase().includes(String(email.value).toLowerCase())
      ? { containsEmail: true }
      : null;
}

export function sameAs(other: AbstractControl): ValidatorFn {
  return (control) => (control.value === other.value ? null : { mismatch: true });
}
