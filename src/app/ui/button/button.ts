import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #label><ng-content /></ng-template>
    @if (routerLink(); as route) {
      <a [class]="classes()" [routerLink]="route">
        <ng-container *ngTemplateOutlet="label" />
      </a>
    } @else if (href(); as href) {
      <a [class]="classes()" [href]="href">
        <ng-container *ngTemplateOutlet="label" />
      </a>
    } @else {
      <button [class]="classes()" [type]="type()" [disabled]="disabled()">
        <ng-container *ngTemplateOutlet="label" />
      </button>
    }
  `,
  host: { style: 'display: contents' },
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly href = input<string>();
  readonly routerLink = input<string>();

  protected readonly classes = computed(
    () =>
      `zb-button zb-button-${this.variant()} zb-button-${this.size()}${this.block() ? ' zb-button-block' : ''}`,
  );
}
