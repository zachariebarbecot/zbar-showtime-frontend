import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  throwError,
  startWith,
  switchMap,
} from 'rxjs';
import { WatchlistControllerService } from '../../api/services/watchlist-controller.service';
import { SearchControllerService } from '../../api/services/search-controller.service';
import { injectSession } from '../../core/auth/session';
import { SearchItem, SearchResults, appendItems, toSearchResults } from './search-results';
import { AppHeader } from '../../ui/app-header/app-header';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { Button } from '../../ui/button/button';
import { Poster } from '../../ui/poster/poster';
import { StatusButton } from '../../ui/status-button/status-button';
import { Icon } from '../../ui/icon/icon';
import { ToastService } from '../../ui/toast/toast.service';
import { RadioChips, RadioOption } from '../../ui/radio-chips/radio-chips';

const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;

const CONFLICT = 409;
const ADD_FAILED = "L'ajout a échoué. Réessaie dans un instant.";

const ALL_TYPES = 'ALL';

const TYPE_OPTIONS: readonly RadioOption[] = [
  { value: ALL_TYPES, label: 'Tout' },
  { value: 'MOVIE', label: 'Films' },
  { value: 'TV', label: 'Séries' },
];

type DoneState = {
  readonly kind: 'done';
  readonly query: string;
  readonly type: string;
} & SearchResults;

type SearchState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'error' }
  | DoneState;

interface Shown {
  readonly items: readonly SearchItem[];
  readonly page: number;
  readonly more: 'idle' | 'loading' | 'failed';
}

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
    StatusButton,
  ],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      <div class="zb-search" role="search">
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
            label="Filtrer"
            labelHidden
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
        <app-empty-state
          title="Aucun résultat pour &quot;{{ current.query }}&quot;"
          text="Vérifie l'orthographe ou essaie un autre titre."
        >
          <app-button variant="secondary" (click)="query.setValue('')">
            Effacer la recherche
          </app-button>
        </app-empty-state>
      } @else {
        <p class="sr-count">
          {{ current.total }} {{ current.total === 1 ? 'résultat' : 'résultats' }}
        </p>
        <div class="sr-grid">
          @for (item of shown().items; track item.key) {
            <app-poster
              [title]="item.title"
              [src]="item.posterUrl"
              [meta]="item.meta"
              [status]="adding(item) ? 'watchlist' : item.status"
            >
              <app-status-button
                kind="watchlist"
                size="sm"
                [controlled]="true"
                [active]="item.watchlisted || adding(item)"
                [locked]="item.watchlisted || adding(item)"
                (add)="add(item)"
                [ariaLabel]="'Ajouter ' + item.title + ' à la watchlist'"
              />
            </app-poster>
          }
        </div>
        @if (shown().more === 'loading') {
          <p role="status">Chargement…</p>
        } @else if (shown().more === 'failed') {
          <app-form-alert message="Le chargement a échoué. Réessaie dans un instant." />
        }
        @if (shown().page < current.totalPages) {
          <div class="sr-more">
            <app-button
              variant="secondary"
              [disabled]="shown().more === 'loading'"
              (click)="loadMore(current)"
            >
              Charger plus
            </app-button>
          </div>
        }
      }
    </main>
  `,
  styles: `
    .zb-search {
      margin-bottom: var(--space-6);
    }
    .sr-count {
      margin: 0 0 var(--space-4);
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
  private readonly toast = inject(ToastService);
  private readonly watchlistApi = inject(WatchlistControllerService);
  private readonly searchApi = inject(SearchControllerService);
  private readonly destroyRef = inject(DestroyRef);

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
      switchMap(([query, type]): Observable<SearchState> => {
        return query.length < MIN_LENGTH
          ? of(IDLE)
          : this.searchApi.search({ query, page: 1, type }).pipe(
              map((response): SearchState => ({
                kind: 'done',
                query,
                type,
                ...toSearchResults(response),
              })),
              catchError(() => of(FAILED)),
              startWith(LOADING),
            );
      }),
    ),
    { initialValue: IDLE },
  );

  protected readonly shown = linkedSignal<SearchState, Shown>({
    source: this.state,
    computation: (state) =>
      state.kind === 'done'
        ? { items: state.items, page: state.page, more: 'idle' }
        : { items: [], page: 0, more: 'idle' },
  });

  private readonly pending = signal<ReadonlySet<string>>(new Set());

  protected adding(item: SearchItem): boolean {
    return this.pending().has(item.key);
  }

  protected add(item: SearchItem): void {
    this.pending.update((keys) => new Set(keys).add(item.key));
    const body = { tmdbId: item.tmdbId };
    (item.type === 'MOVIE'
      ? this.watchlistApi.addMovie({ body })
      : this.watchlistApi.addSeries({ body })
    )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          error.status === CONFLICT ? of(undefined) : throwError(() => error),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.pending.update((keys) => new Set([...keys].filter((key) => key !== item.key)));
        }),
      )
      .subscribe({
        next: () => {
          this.shown.update((shown) => ({
            ...shown,
            items: shown.items.map((shown) =>
              shown.key === item.key ? { ...shown, watchlisted: true, status: 'watchlist' } : shown,
            ),
          }));
        },
        error: () => this.toast.show(ADD_FAILED),
      });
  }

  protected loadMore(current: DoneState): void {
    const { page } = this.shown();
    const updateIfCurrent = (change: (shown: Shown) => Shown) => {
      if (this.state() === current) this.shown.update(change);
    };
    this.shown.update((shown) => ({ ...shown, more: 'loading' }));
    this.searchApi
      .search({ query: current.query, page: page + 1, type: current.type })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          updateIfCurrent((shown) => ({
            items: appendItems(shown.items, toSearchResults(response).items),
            page: page + 1,
            more: 'idle',
          }));
        },
        error: () => {
          updateIfCurrent((shown) => ({ ...shown, more: 'failed' }));
        },
      });
  }
}
