import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-placeholder',
  template: '<p>Bientôt disponible.</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Placeholder {}
