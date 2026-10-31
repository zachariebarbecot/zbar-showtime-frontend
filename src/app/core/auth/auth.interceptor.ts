import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService, authUrl, isApiRequest } from './auth.service';

const isAuthRequest = (url: string): boolean => url.startsWith(authUrl());

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url) || isAuthRequest(request.url)) {
    return next(request);
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const authorized =
    token === null ? request : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        void router.navigate(['/connexion']);
      }
      return throwError(() => error);
    }),
  );
};
