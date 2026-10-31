import { booleanAttribute, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  template: '',
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly href = input<string>();
  readonly routerLink = input<string>();
}
