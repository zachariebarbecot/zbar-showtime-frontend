import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { WatchlistControllerService } from '../api/services/watchlist-controller.service';

const CONFLICT = 409;

export const ADD_FAILED = "L'ajout a échoué. Réessaie dans un instant.";

@Injectable({ providedIn: 'root' })
export class WatchlistAdder {
  private readonly api = inject(WatchlistControllerService);

  /** Adds the title; an already listed one (409) counts as added. */
  add(type: 'MOVIE' | 'TV', tmdbId: number): Observable<unknown> {
    const body = { tmdbId };
    return (type === 'MOVIE' ? this.api.addMovie({ body }) : this.api.addSeries({ body })).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === CONFLICT ? of(undefined) : throwError(() => error),
      ),
    );
  }
}
