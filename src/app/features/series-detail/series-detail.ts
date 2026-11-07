import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SeriesControllerService } from '../../api/services/series-controller.service';
import { injectSession } from '../../core/auth/session';
import { AppHeader } from '../../ui/app-header/app-header';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-series-detail',
  imports: [AppHeader],
  template: `
    @if (session.answered()) {
      <app-header active="search" [user]="session.user()" (logout)="session.logout()" />
    }
    <main class="hm-wrap">
      @if (series.isLoading()) {
        <p role="status">Chargement…</p>
      }
    </main>
  `,
})
export class SeriesDetail {
  protected readonly session = injectSession();
  private readonly api = inject(SeriesControllerService);
  private readonly tmdbId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('tmdbId')))),
    { requireSync: true },
  );
  protected readonly series = rxResource({
    params: this.tmdbId,
    stream: ({ params: tmdbId }) => this.api.detail({ tmdbId }),
  });
}
