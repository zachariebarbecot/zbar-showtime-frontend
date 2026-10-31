import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

@Component({
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
          [value]="value()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() ? messageId() : null"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
        @if (type() === 'password') {
          <button
            type="button"
            class="zb-icon-btn zb-icon-btn-sm"
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

  protected readonly value = signal('');
  protected readonly revealed = signal(false);
  protected readonly inputType = computed(() =>
    this.type() === 'password' && this.revealed() ? 'text' : this.type(),
  );
  private propagateChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected id(): string {
    return `zb-f-${this.name()}`;
  }

  protected messageId(): string {
    return `${this.id()}-msg`;
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.propagateChange(value);
  }

  writeValue(value: string): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
