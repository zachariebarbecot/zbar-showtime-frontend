import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface RadioOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-radio-chips',
  template: ``,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioChips), multi: true },
  ],
})
export class RadioChips implements ControlValueAccessor {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly RadioOption[]>();
  readonly error = input<string>();

  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}
