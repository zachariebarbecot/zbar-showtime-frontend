import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { MovieControllerService } from '../../api/services/movie-controller.service';
import { injectSession } from '../../core/auth/session';
import { AppHeader } from '../../ui/app-header/app-header';
import { Button } from '../../ui/button/button';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { toMovieDetailView } from './movie-detail-view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-movie-detail',
  imports: [AppHeader, Button, EmptyState, FormAlert, RouterLink],
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
            <h2 class="md-section-title">Réalisation</h2>
            <ul class="md-people">
              @for (director of view.directors; track director) {
                <li>{{ director }}</li>
              }
            </ul>
          </section>
        }
      }
    </main>
  `,
})
export class MovieDetail {
  protected readonly session = injectSession();
  private readonly api = inject(MovieControllerService);
  private readonly tmdbId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => {
        const id = Number(params.get('tmdbId'));
        return Number.isInteger(id) && id > 0 ? id : undefined;
      }),
    ),
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
}
