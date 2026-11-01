import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SearchControllerService } from '../../api/services/search-controller.service';
import { injectSession } from '../../core/auth/session';
import { SearchResults, toSearchResults } from './search-results';
import { AppHeader } from '../../ui/app-header/app-header';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { Button } from '../../ui/button/button';
import { Poster } from '../../ui/poster/poster';
import { Icon } from '../../ui/icon/icon';
import { RadioChips, RadioOption } from '../../ui/radio-chips/radio-chips';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

const ALL_TYPES = 'all';

const TYPE_OPTIONS: readonly RadioOption[] = [
  { value: ALL_TYPES, label: 'Tout' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Séries' },
];

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
  imports: [
    AppHeader,
    Button,
    EmptyState,
    FormAlert,
    Icon,
    Poster,
    RadioChips,
    ReactiveFormsModule,
  ],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      <div class="zb-search">
        <div class="zb-search-field">
          <svg appIcon name="search"></svg>
          <input
            type="search"
            name="search"
            autocomplete="off"
            aria-label="Rechercher un film ou une série"
            placeholder="Rechercher un film ou une série"
            [formControl]="query"
          />
        </div>
        <div class="zb-search-scopes">
          <app-radio-chips
            name="type"
            label="Type de contenu"
            [options]="typeOptions"
            [formControl]="type"
          />
        </div>
      </div>
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
        @if (current.page < current.totalPages) {
          <div class="sr-more">
            <app-button variant="secondary">Charger plus</app-button>
          </div>
        }
      }
    </main>
  `,
  styles: `
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
    .sr-more {
      display: flex;
      justify-content: center;
      margin-top: var(--space-6);
    }
  `,
})
export class Search {
  protected readonly session = injectSession();
  private readonly searchApi = inject(SearchControllerService);

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly type = new FormControl(ALL_TYPES, { nonNullable: true });
  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly state = toSignal(
    combineLatest([
      this.query.valueChanges.pipe(
        map((value) => value.trim()),
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        startWith(''),
      ),
      this.type.valueChanges.pipe(startWith(this.type.value)),
    ]).pipe(
      switchMap(([query, type]): Observable<SearchState> =>
        query.length < MIN_LENGTH
          ? of(IDLE)
          : this.searchApi
              .search({ query, page: 1, type: type === ALL_TYPES ? undefined : type })
              .pipe(
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
}
