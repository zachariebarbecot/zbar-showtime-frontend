import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../core/auth/auth.service';
import { Icon } from '../icon/icon';
import { Logo } from '../logo/logo';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [Icon, Logo, RouterLink, UserMenu],
  template: `
    <header class="zb-head">
      <div class="zb-head-in">
        <app-logo href="/accueil" />
        <nav class="zb-head-nav" aria-label="Navigation principale">
          <a class="zb-head-link" routerLink="/accueil" aria-current="page">
            <svg appIcon name="home"></svg>
            <span>Accueil</span>
          </a>
        </nav>
        <app-user-menu
          [firstName]="user().firstName"
          [lastName]="user().lastName"
          [email]="user().email"
        />
      </div>
    </header>
  `,
})
export class AppHeader {
  readonly user = input.required<User>();
}
