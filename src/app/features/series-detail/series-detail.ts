import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { injectSession } from '../../core/auth/session';
import { AppHeader } from '../../ui/app-header/app-header';
import { Button } from '../../ui/button/button';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { toSeriesDetailView } from './series-detail-view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-detail',
  imports: [AppHeader, Button, EmptyState, RouterLink],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      <a class="zb-link md-back" routerLink="/recherche">Retour à la recherche</a>
      @if (series.isLoading()) {
        <p role="status">Chargement…</p>
      } @else if (notFound()) {
        <app-empty-state title="Série introuvable" text="Cette série n'existe pas ou plus.">
          <app-button link="/recherche">Retour à la recherche</app-button>
        </app-empty-state>
      } @else if (view(); as view) {
        <article class="md-hero">
          <figure class="md-media">
            @if (view.posterUrl) {
              <img class="md-poster" [src]="view.posterUrl" alt="" />
            } @else {
              <div class="zb-poster-frame md-poster-empty">{{ view.name }}</div>
            }
          </figure>
          <div class="md-info">
            @if (view.name) {
              <h1 class="md-title">{{ view.name }}</h1>
            }
            @if (view.originalName) {
              <p class="md-original">{{ view.originalName }}</p>
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
export class SeriesDetail {
  protected readonly session = injectSession();
  private readonly api = inject(SeriesControllerService);
  private readonly tmdbId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => {
        const id = Number(params.get('tmdbId'));
        return Number.isInteger(id) && id > 0 ? id : undefined;
      }),
    ),
    { requireSync: true },
  );
  protected readonly series = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail({ tmdbId }),
  });
  protected readonly view = computed(() =>
    this.series.hasValue() ? toSeriesDetailView(this.series.value()) : undefined,
  );
  protected readonly notFound = computed(() => {
    if (this.tmdbId() === undefined) return true;
    const error = this.series.error();
    return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
  });
}
