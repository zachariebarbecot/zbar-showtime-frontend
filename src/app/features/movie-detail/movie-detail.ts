import { HttpErrorResponse } from '@angular/common/http';
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
import { AppHeader } from '../../ui/app-header/app-header';
import { Button } from '../../ui/button/button';
import { CastCard } from '../../ui/cast-card/cast-card';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
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
    CastCard,
    EmptyState,
    FormAlert,
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
        @if (view.directors.length) {
          <section class="md-directors">
            <h2 class="zb-car-title">Réalisation</h2>
            <ul class="md-people">
              @for (director of view.directors; track director) {
                <li>{{ director }}</li>
              }
            </ul>
          </section>
        }
        @if (view.cast.length) {
          <section class="zb-car md-cast">
            <div class="zb-car-head">
              <h2 class="zb-car-title">Casting</h2>
            </div>
            <div class="zb-car-track">
              @for (member of view.cast; track $index) {
                <app-cast-card
                  [name]="member.name"
                  [character]="member.character"
                  [photoUrl]="member.photoUrl"
                />
              }
            </div>
          </section>
        }
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
  private readonly tmdbId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => {
        const id = Number(params.get('tmdbId'));
        return Number.isInteger(id) && id > 0 ? id : undefined;
      }),
    ),
    { requireSync: true },
  );
  protected readonly movie = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail1({ tmdbId }),
  });
  protected readonly view = computed(() =>
    this.movie.hasValue() ? toMovieDetailView(this.movie.value()) : undefined,
  );
  protected readonly notFound = computed(() => {
    if (this.tmdbId() === undefined) return true;
    const error = this.movie.error();
    return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
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
