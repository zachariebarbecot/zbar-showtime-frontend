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
import { SearchResults, toSearchResults } from './search-results';
import { AppHeader } from '../../ui/app-header/app-header';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { Poster } from '../../ui/poster/poster';
import { TextField } from '../../ui/text-field/text-field';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

type SearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | ({ readonly kind: 'done'; readonly query: string } & SearchResults);

const IDLE: SearchState = { kind: 'idle' };
const LOADING: SearchState = { kind: 'loading' };
const FAILED: SearchState = { kind: 'error' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search',
  imports: [AppHeader, EmptyState, FormAlert, Poster, ReactiveFormsModule, TextField],
  template: `
    <app-header active="search" [user]="user()" (logout)="logout()" />
    <main class="hm-wrap">
      <app-text-field name="search" label="Rechercher un film ou une série" [formControl]="query" />
      @let current = state();
      @if (current.kind === 'idle') {
        <app-empty-state
          title="Que veux-tu regarder ?"
          text="Saisis au moins 2 caractères pour chercher un film ou une série."
        />
      } @else if (current.kind === 'loading') {
        <p role="status">Recherche en cours…</p>
      } @else if (current.kind === 'error') {
        <app-form-alert message="La recherche a échoué. Réessaie dans un instant." />
      } @else if (current.items.length === 0) {
        <app-empty-state title="Aucun résultat pour &quot;{{ current.query }}&quot;" />
      } @else {
        <p class="sr-count">
          {{ current.total }} {{ current.total === 1 ? 'résultat' : 'résultats' }}
        </p>
        <div class="sr-grid">
          @for (item of current.items; track item.id) {
            <app-poster [title]="item.title" [src]="item.posterUrl" [meta]="item.meta" />
          }
        </div>
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
    .sr-count {
      margin: var(--space-6) 0 var(--space-4);
      color: var(--ink-muted);
      font: 400 14px/20px var(--font-sans);
    }
    .sr-grid {
      --poster-width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--space-4);
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
          ? of(IDLE)
          : this.searchApi.search({ query, page: 1 }).pipe(
              map((response): SearchState => ({
                kind: 'done',
                query,
                ...toSearchResults(response),
              })),
              catchError(() => of(FAILED)),
              startWith(LOADING),
            ),
      ),
    ),
    { initialValue: IDLE },
  );

  protected readonly user = toSignal(this.auth.me().pipe(catchError(() => of(undefined))));

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
