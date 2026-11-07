import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';
import { MovieControllerService } from '../../api/services/movie-controller.service';
import { injectSession } from '../../core/auth/session';
import { ADD_FAILED, WatchlistAdder } from '../../shared/watchlist-adder';
import { isNotFound, tmdbIdOf } from '../../shared/tmdb-id';
import { AppHeader } from '../../ui/app-header/app-header';
import { Button } from '../../ui/button/button';
import { CastRow } from '../../ui/cast-row/cast-row';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { PeopleSection } from '../../ui/people-section/people-section';
import { StatusBadge } from '../../ui/status-badge/status-badge';
import { StatusButton } from '../../ui/status-button/status-button';
import { ToastService } from '../../ui/toast/toast.service';
import { toMovieDetailView } from './movie-detail-view';

const ADDED = 'Ajouté à ta watchlist.';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-movie-detail',
  imports: [
    AppHeader,
    Button,
    CastRow,
    EmptyState,
    FormAlert,
    PeopleSection,
    RouterLink,
    StatusBadge,
    StatusButton,
  ],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      <a class="zb-link md-back" routerLink="/recherche">Retour à la recherche</a>
      @if (movie.isLoading()) {
        <p role="status">Chargement…</p>
      } @else if (notFound()) {
        <app-empty-state title="Film introuvable" text="Ce film n'existe pas ou plus.">
          <app-button link="/recherche">Retour à la recherche</app-button>
        </app-empty-state>
      } @else if (movie.error()) {
        <app-form-alert message="Impossible de charger la fiche pour le moment." />
        <app-button variant="secondary" (click)="movie.reload()">Réessayer</app-button>
      } @else if (view(); as view) {
        <article class="md-hero">
          <figure class="md-media">
            @if (view.posterUrl) {
              <img class="md-poster" [src]="view.posterUrl" alt="" />
            } @else {
              <div class="zb-poster-frame md-poster-empty">{{ view.title }}</div>
            }
          </figure>
          <div class="md-info">
            @if (view.title) {
              <h1 class="md-title">{{ view.title }}</h1>
            }
            @if (view.originalTitle) {
              <p class="md-original">{{ view.originalTitle }}</p>
            }
            @if (view.meta) {
              <p class="zb-meta md-meta">{{ view.meta }}</p>
            }
            <div class="md-watchlist">
              @if (status(); as status) {
                <app-status-badge [status]="status" />
              } @else {
                <app-status-button
                  kind="watchlist"
                  [controlled]="true"
                  [locked]="adding()"
                  (add)="add()"
                />
              }
            </div>
            @if (view.genres.length) {
              <ul class="md-genres">
                @for (genre of view.genres; track genre) {
                  <li class="zb-tag">{{ genre }}</li>
                }
              </ul>
            }
            @if (view.overview) {
              <p class="md-overview">{{ view.overview }}</p>
            }
          </div>
        </article>
        <app-people-section title="Réalisation" [names]="view.directors" />
        <app-cast-row [cast]="view.cast" />
      }
    </main>
  `,
})
export class MovieDetail {
  protected readonly session = injectSession();
  private readonly api = inject(MovieControllerService);
  private readonly adder = inject(WatchlistAdder);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tmdbId = toSignal(inject(ActivatedRoute).paramMap.pipe(map(tmdbIdOf)), {
    requireSync: true,
  });
  protected readonly movie = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail1({ tmdbId }),
  });
  protected readonly view = computed(() =>
    this.movie.hasValue() ? toMovieDetailView(this.movie.value()) : undefined,
  );
  protected readonly notFound = computed(() => {
    if (this.tmdbId() === undefined) return true;
    return isNotFound(this.movie.error());
  });
  private readonly added = signal(false);
  protected readonly adding = signal(false);
  protected readonly status = computed(() => (this.added() ? 'watchlist' : this.view()?.status));

  protected add(): void {
    const tmdbId = this.tmdbId();
    if (tmdbId === undefined) return;
    this.adding.set(true);
    this.adder
      .add('MOVIE', tmdbId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.adding.set(false)),
      )
      .subscribe({
        next: () => {
          this.added.set(true);
          this.toast.show(ADDED);
        },
        error: () => this.toast.show(ADD_FAILED),
      });
  }
}
