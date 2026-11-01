import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast',
  template: `<div role="status" aria-live="polite"></div>`,
})
export class Toast {}
