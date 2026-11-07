import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastService } from '../ui/toast/toast.service';
import { ADD_FAILED, TitleType, WatchlistAdder } from './watchlist-adder';

const ADDED = 'Ajouté à ta watchlist.';

/** Adds a title to the watchlist with a toast; must run in an injection context. */
export function injectWatchlistAdd() {
  const adder = inject(WatchlistAdder);
  const toast = inject(ToastService);
  const destroyRef = inject(DestroyRef);
  const added = signal(false);
  const adding = signal(false);

  const add = (type: TitleType, tmdbId: number): void => {
    adding.set(true);
    adder
      .add(type, tmdbId)
      .pipe(
        takeUntilDestroyed(destroyRef),
        finalize(() => adding.set(false)),
      )
      .subscribe({
        next: () => {
          added.set(true);
          toast.show(ADDED);
        },
        error: () => toast.show(ADD_FAILED),
      });
  };

  return { added: added.asReadonly(), adding: adding.asReadonly(), add };
}
