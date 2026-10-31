import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SearchControllerService } from '../../api/services/search-controller.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppHeader } from '../../ui/app-header/app-header';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { TextField } from '../../ui/text-field/text-field';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

type SearchState = 'idle' | 'loading' | 'done';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search',
  imports: [AppHeader, EmptyState, ReactiveFormsModule, TextField],
  template: `
    <app-header active="search" [user]="user()" (logout)="logout()" />
    <main class="hm-wrap">
      <app-text-field name="search" label="Rechercher un film ou une série" [formControl]="query" />
      @switch (state()) {
        @case ('idle') {
          <app-empty-state
            title="Que veux-tu regarder ?"
            text="Saisis au moins 2 caractères pour chercher un film ou une série."
          />
        }
        @case ('loading') {
          <p role="status">Recherche en cours…</p>
        }
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
  private readonly searchApi = inject(SearchControllerService);

  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly state = toSignal(
    this.query.valueChanges.pipe(
      map((value) => value.trim()),
      debounceTime(DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((query): Observable<SearchState> =>
        query.length < MIN_LENGTH
          ? of('idle')
          : this.searchApi.search({ query, page: 1 }).pipe(
              map((): SearchState => 'done'),
              startWith<SearchState>('loading'),
            ),
      ),
    ),
    { initialValue: 'idle' as SearchState },
  );

  protected readonly user = toSignal(this.auth.me().pipe(catchError(() => of(undefined))));

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
