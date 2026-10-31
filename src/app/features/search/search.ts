import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AppHeader } from '../../ui/app-header/app-header';
import { EmptyState } from '../../ui/empty-state/empty-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search',
  imports: [AppHeader, EmptyState],
  template: `
    <app-header active="search" [user]="user()" (logout)="logout()" />
    <main class="hm-wrap">
      <app-empty-state
        title="Que veux-tu regarder ?"
        text="Saisis au moins 2 caractères pour chercher un film ou une série."
      />
    </main>
  `,
  styles: `
    .hm-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-8);
      box-sizing: border-box;
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
    }
  `,
})
export class Search {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = toSignal(this.auth.me().pipe(catchError(() => of(undefined))));

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
