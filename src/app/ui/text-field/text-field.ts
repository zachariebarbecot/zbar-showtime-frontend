import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-text-field',
  imports: [Icon],
  template: `
    <div class="zb-field" [class.zb-field-invalid]="error()">
      <label class="zb-field-label" [for]="id()">{{ label() }}</label>
      <div class="zb-field-control">
        <input
          [id]="id()"
          [name]="name()"
          [type]="inputType()"
          #field
          [value]="value()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() ? messageId() : null"
          (input)="onInput(field.value)"
          (blur)="onTouched()"
        />
        @if (type() === 'password') {
          <button
            type="button"
            class="zb-icon-btn zb-icon-btn-sm field-eye"
            [attr.aria-pressed]="revealed()"
            [attr.aria-label]="revealed() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            (click)="revealed.set(!revealed())"
          >
            <svg appIcon [name]="revealed() ? 'eyeOff' : 'eye'"></svg>
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
    .field-eye {
      position: relative;
    }
    .field-eye::after {
      content: '';
      position: absolute;
      inset: -8px;
    }
  `,
  host: { style: 'display: contents' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true },
  ],
})
export class TextField implements ControlValueAccessor {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<'text' | 'email' | 'password' | 'date'>('text');
  readonly error = input<string>();
  readonly autocomplete = input<string>();

  protected readonly value = signal('');
  protected readonly id = computed(() => `zb-f-${this.name()}`);
  protected readonly messageId = computed(() => `${this.id()}-msg`);
  protected readonly revealed = signal(false);
  protected readonly inputType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );
  private propagateChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(value: string): void {
    this.value.set(value);
    this.propagateChange(value);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
