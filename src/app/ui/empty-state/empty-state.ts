import { Component, input } from '@angular/core';

@Component({ selector: 'app-empty-state', template: '' })
export class EmptyState {
  readonly title = input.required<string>();
  readonly text = input<string>();
}
