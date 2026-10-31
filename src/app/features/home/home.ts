import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/auth/auth.service';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { AppHeader } from '../../ui/app-header/app-header';

const isUnauthorized = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && error.status === 401;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [AppHeader, FormAlert],
  template: `
    @if (answered()) {
      <app-header [user]="user()" (logout)="logout()" />
    }
    <main class="hm-wrap">
      @if (user(); as me) {
        <!-- prettier-ignore -->
        <h1 class="hm-hello">Salut, <span>{{ me.firstName }}.</span></h1>
      } @else if (failed()) {
        <app-form-alert message="Une erreur est survenue. Réessaie dans un instant." />
      }
    </main>
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = signal<User | undefined>(undefined);
  protected readonly failed = signal(false);
  protected readonly answered = computed(() => this.user() !== undefined || this.failed());

  constructor() {
    this.auth
      .me()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (user) => this.user.set(user),
        error: (error: unknown) => this.failed.set(!isUnauthorized(error)),
      });
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
