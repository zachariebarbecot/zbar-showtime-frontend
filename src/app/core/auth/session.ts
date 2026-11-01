import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';

const isUnauthorized = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && error.status === 401;

// Loads the signed in user for a page and offers the logout; call in an injection context.
export function injectSession() {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = signal<User | undefined>(undefined);
  const failed = signal(false);

  auth
    .me()
    .pipe(takeUntilDestroyed())
    .subscribe({
      next: (me) => user.set(me),
      error: (error: unknown) => failed.set(!isUnauthorized(error)),
    });

  return {
    user: user.asReadonly(),
    failed: failed.asReadonly(),
    answered: computed(() => user() !== undefined || failed()),
    logout: () => {
      auth.logout();
      void router.navigateByUrl('/');
    },
  };
}
