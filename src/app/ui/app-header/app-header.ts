import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../core/auth/auth.service';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { Logo } from '../logo/logo';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [Button, Icon, Logo, RouterLink, UserMenu],
  template: `
    <header class="zb-head">
      <div class="zb-head-in">
        <app-logo href="/accueil" />
        <nav class="zb-head-nav" aria-label="Navigation principale">
          <a
            class="zb-head-link"
            routerLink="/accueil"
            [attr.aria-current]="active() === 'home' ? 'page' : null"
          >
            <svg appIcon name="home"></svg>
            <span>Accueil</span>
          </a>
          <a
            class="zb-head-link"
            routerLink="/recherche"
            [attr.aria-current]="active() === 'search' ? 'page' : null"
          >
            <svg appIcon name="search"></svg>
            <span>Recherche</span>
          </a>
        </nav>
        @if (user(); as user) {
          <app-user-menu
            [firstName]="user.firstName"
            [lastName]="user.lastName"
            [email]="user.email"
            (logout)="logout.emit()"
          />
        } @else {
          <app-button variant="ghost" (click)="logout.emit()">Se déconnecter</app-button>
        }
      </div>
    </header>
  `,
})
export class AppHeader {
  readonly active = input.required<'home' | 'search'>();
  readonly user = input<User>();
  readonly logout = output<void>();
}
