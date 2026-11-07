import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { injectSession } from '../../core/auth/session';
import { isNotFound, tmdbIdOf } from '../../shared/tmdb-id';
import { injectWatchlistAdd } from '../../shared/watchlist-add';
import { AppHeader } from '../../ui/app-header/app-header';
import { Button } from '../../ui/button/button';
import { CastRow } from '../../ui/cast-row/cast-row';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { ShowStatus } from '../../ui/show-status/show-status';
import { PeopleSection } from '../../ui/people-section/people-section';
import { StatusBadge } from '../../ui/status-badge/status-badge';
import { StatusButton } from '../../ui/status-button/status-button';
import { toSeriesDetailView } from './series-detail-view';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-detail',
  imports: [
    AppHeader,
    Button,
    CastRow,
    EmptyState,
    FormAlert,
    PeopleSection,
    RouterLink,
    ShowStatus,
    StatusBadge,
    StatusButton,
  ],
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
      } @else if (series.error()) {
        <app-form-alert message="Impossible de charger la fiche pour le moment." />
        <app-button variant="secondary" (click)="series.reload()">Réessayer</app-button>
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
            @if (view.status || view.period) {
              <div class="md-airing">
                @if (view.status) {
                  <app-show-status [status]="view.status" />
                }
                @if (view.period) {
                  <span class="zb-meta md-period">{{ view.period }}</span>
                }
              </div>
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
        <app-people-section title="Création" [names]="view.creators" />
        <app-cast-row [cast]="view.cast" />
      }
    </main>
  `,
})
export class SeriesDetail {
  protected readonly session = injectSession();
  private readonly api = inject(SeriesControllerService);
  private readonly watchlist = injectWatchlistAdd();
  private readonly tmdbId = toSignal(inject(ActivatedRoute).paramMap.pipe(map(tmdbIdOf)), {
    requireSync: true,
  });
  protected readonly series = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail({ tmdbId }),
  });
  protected readonly view = computed(() =>
    this.series.hasValue() ? toSeriesDetailView(this.series.value()) : undefined,
  );
  protected readonly notFound = computed(() => {
    if (this.tmdbId() === undefined) return true;
    return isNotFound(this.series.error());
  });
  protected readonly adding = this.watchlist.adding;
  protected readonly status = computed(() =>
    this.watchlist.added() ? 'watchlist' : this.view()?.watchlist,
  );

  protected add(): void {
    const tmdbId = this.tmdbId();
    if (tmdbId === undefined) return;
    this.watchlist.add('TV', tmdbId);
  }
}
