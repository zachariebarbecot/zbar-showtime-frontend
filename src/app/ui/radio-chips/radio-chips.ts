import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

export interface RadioOption {
  readonly value: string;
  readonly label: string;
}

const STEP_BY_KEY: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-radio-chips',
  imports: [Icon],
  template: `
    <div class="zb-field" [class.zb-field-invalid]="error()">
      <span class="zb-field-label" [id]="labelId()">{{ label() }}</span>
      <div
        class="chips"
        role="radiogroup"
        [attr.data-name]="name()"
        [attr.aria-labelledby]="labelId()"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? messageId() : null"
        (focusout)="onFocusOut($event)"
      >
        @for (option of options(); track option.value; let index = $index) {
          <button
            #chip
            type="button"
            role="radio"
            class="zb-chip"
            [attr.aria-checked]="option.value === value()"
            [tabindex]="index === tabbableIndex() ? 0 : -1"
            (click)="select(index)"
            (keydown)="onKeydown($event, index)"
          >
            {{ option.label }}
          </button>
        }
      </div>
      @if (error()) {
        <div class="zb-field-msg zb-field-error" [id]="messageId()" aria-live="polite">
          <svg appIcon name="alert"></svg>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .zb-chip {
      position: relative;
    }
    .zb-chip::after {
      content: '';
      position: absolute;
      inset: -6px 0;
    }
    .zb-chip[aria-checked='true'] {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--bg);
    }
  `,
  host: { style: 'display: contents' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioChips), multi: true },
  ],
})
export class RadioChips implements ControlValueAccessor {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly RadioOption[]>();
  readonly error = input<string>();

  protected readonly value = signal('');
  protected readonly labelId = computed(() => `zb-f-${this.name()}-label`);
  protected readonly messageId = computed(() => `zb-f-${this.name()}-msg`);
  protected readonly tabbableIndex = computed(() =>
    Math.max(
      0,
      this.options().findIndex((option) => option.value === this.value()),
    ),
  );
  private readonly chips = viewChildren<ElementRef<HTMLButtonElement>>('chip');
  private propagateChange: (value: string) => void = () => {};
  private propagateTouched: () => void = () => {};

  protected select(index: number): void {
    this.value.set(this.options()[index].value);
    this.propagateChange(this.value());
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const step = STEP_BY_KEY[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    const count = this.options().length;
    const target = (index + step + count) % count;
    this.select(target);
    this.chips()[target].nativeElement.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    const group = event.currentTarget;
    const next = event.relatedTarget;
    if (group instanceof Node && !(next instanceof Node && group.contains(next))) {
      this.propagateTouched();
    }
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }
}
