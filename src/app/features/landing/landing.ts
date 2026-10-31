import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '../../ui/button/button';
import { Logo } from '../../ui/logo/logo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landing',
  imports: [Button, Logo],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
