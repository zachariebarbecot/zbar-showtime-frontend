import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { map } from 'rxjs';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ErrorMessages = Readonly<Record<string, string>>;

/** First error message of the control, shown only once the control has been touched. */
export function errorOf(control: AbstractControl, messages: ErrorMessages): string | undefined {
  const failed = Object.keys(control.errors ?? {})[0];
  return control.touched && failed ? messages[failed] : undefined;
}

/** Live `errorOf` for a control. Call it in an injection context. */
export function fieldError(
  control: AbstractControl,
  messages: ErrorMessages,
): Signal<string | undefined> {
  return toSignal(control.events.pipe(map(() => errorOf(control, messages))), {
    initialValue: undefined,
  });
}
