import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectSession } from '../../core/auth/session';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { AppHeader } from '../../ui/app-header/app-header';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [AppHeader, FormAlert],
  template: `
    @if (session.answered()) {
      <app-header active="home" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      @if (session.user(); as me) {
        <!-- prettier-ignore -->
        <h1 class="hm-hello">Salut, <span>{{ me.firstName }}.</span></h1>
      } @else if (session.failed()) {
        <app-form-alert message="Une erreur est survenue. Réessaie dans un instant." />
      }
    </main>
  `,
  styles: `
    .hm-hello {
      margin: 0;
      font: 700 40px/42px var(--font-display);
      letter-spacing: 0.01em;
    }
    .hm-hello span {
      color: var(--marquee-ink);
    }
    @media (max-width: 599px) {
      .hm-hello {
        font-size: 32px;
        line-height: 34px;
      }
    }
  `,
})
export class Home {
  protected readonly session = injectSession();
}
