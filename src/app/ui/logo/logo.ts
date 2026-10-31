import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: '',
})
export class Logo {
  readonly size = input<'md' | 'lg'>('md');
  readonly variant = input<'full' | 'mark'>('full');
  readonly href = input<string>();
}
