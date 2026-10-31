import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '../../core/auth/auth.service';
import { AppHeader } from '../../ui/app-header/app-header';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [AppHeader],
  template: `
    @if (user(); as user) {
      <app-header [user]="user" />
      <main class="hm-wrap">
        <h1 class="hm-hello">Salut, <span>{{ user.firstName }}.</span></h1>
      </main>
    }
  `,
  styles: `
    .hm-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-8);
      box-sizing: border-box;
    }
    .hm-hello {
      margin: 0;
      font: 700 40px/42px var(--font-display);
      letter-spacing: 0.01em;
    }
    .hm-hello span {
      color: var(--marquee-ink);
    }
    @media (max-width: 1023px) {
      .hm-wrap {
        padding: var(--space-6);
      }
    }
    @media (max-width: 599px) {
      .hm-wrap {
        padding: var(--space-4);
      }
      .hm-hello {
        font-size: 32px;
        line-height: 34px;
      }
    }
  `,
})
export class Home {
  protected readonly user = signal<User | null>(null);

  constructor() {
    inject(AuthService)
      .me()
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.user.set(user));
  }
}
