import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MovieControllerService } from '../../api/services/movie-controller.service';
import { injectSession } from '../../core/auth/session';
import { AppHeader } from '../../ui/app-header/app-header';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-movie-detail',
  imports: [AppHeader],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      @if (movie.isLoading()) {
        <p role="status">Chargement…</p>
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
    params: computed(() => this.tmdbId()),
    stream: ({ params: tmdbId }) => this.api.detail1({ tmdbId }),
  });
}
