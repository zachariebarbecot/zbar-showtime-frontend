import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { MovieControllerService } from '../../api/services/movie-controller.service';
import { injectSession } from '../../core/auth/session';
import { AppHeader } from '../../ui/app-header/app-header';
import { toMovieDetailView } from './movie-detail-view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-movie-detail',
  imports: [AppHeader, RouterLink],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      <a class="zb-link md-back" routerLink="/recherche">Retour à la recherche</a>
      @if (movie.isLoading()) {
        <p role="status">Chargement…</p>
      } @else if (view(); as view) {
        <article class="md-hero">
          <figure class="md-media">
            @if (view.posterUrl) {
              <img class="md-poster" [src]="view.posterUrl" alt="" />
            } @else {
              <div class="md-poster-empty">{{ view.title }}</div>
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
      }
    </main>
  `,
})
export class MovieDetail {
  protected readonly session = injectSession();
  private readonly api = inject(MovieControllerService);
  private readonly tmdbId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('tmdbId')))),
  );
  protected readonly movie = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail1({ tmdbId }),
  });
  protected readonly view = computed(() =>
    this.movie.hasValue() ? toMovieDetailView(this.movie.value()) : undefined,
  );
}
