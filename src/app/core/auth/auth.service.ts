import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest as ApiRegisterRequest } from '../../api/models/register-request';
import { UserResponse } from '../../api/models/user-response';
import { AuthControllerService } from '../../api/services/auth-controller.service';
import { UserControllerService } from '../../api/services/user-controller.service';

export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const TOKEN_STORAGE = new InjectionToken<TokenStorage>('TOKEN_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

const STORAGE_KEY = 'token';

export const authUrl = (): string => `${environment.apiUrl}/auth/`;

export const isApiRequest = (url: string): boolean =>
  environment.apiUrl === ''
    ? url.startsWith('/') && !url.startsWith('//')
    : url.startsWith(`${environment.apiUrl}/`);

// The spec types `gender` as a plain string: the allowed values stay named here.
export type Gender = 'MALE' | 'FEMALE';

export type RegisterRequest = Required<Omit<ApiRegisterRequest, 'gender'>> & {
  readonly gender: Gender;
};

export type User = Pick<Required<UserResponse>, 'firstName' | 'lastName' | 'email'>;

function present<T>(value: T | undefined, field: string): T {
  if (value === undefined) {
    throw new Error(`Incomplete API response: missing ${field}`);
  }
  return value;
}

// The generated `register` reads the body as text (empty 201), so an error body arrives as raw JSON text.
function withParsedBody(error: unknown): Observable<never> {
  if (!(error instanceof HttpErrorResponse) || typeof error.error !== 'string') {
    return throwError(() => error);
  }
  try {
    return throwError(
      () =>
        new HttpErrorResponse({
          error: JSON.parse(error.error),
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
        }),
    );
  } catch {
    return throwError(() => error);
  }
}

const toUser = (dto: UserResponse): User => ({
  firstName: present(dto.firstName, 'firstName'),
  lastName: present(dto.lastName, 'lastName'),
  email: present(dto.email, 'email'),
});

function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(payload));
    if (typeof claims !== 'object' || claims === null || !('exp' in claims)) {
      return true;
    }
    return typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthControllerService);
  private readonly userApi = inject(UserControllerService);
  private readonly storage = inject(TOKEN_STORAGE);

  private readonly _token = signal<string | null>(this.storage.getItem(STORAGE_KEY));
  readonly token = this._token.asReadonly();

  isAuthenticated(): boolean {
    const token = this.token();
    if (token === null) {
      return false;
    }
    if (isExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  login(email: string, password: string): Observable<void> {
    return this.authApi.login({ body: { email, password } }).pipe(
      tap((response) => {
        const token = present(response.token, 'token');
        this.storage.setItem(STORAGE_KEY, token);
        this._token.set(token);
      }),
      map(() => undefined),
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.authApi.register({ body: request }).pipe(catchError(withParsedBody));
  }

  me(): Observable<User> {
    return this.userApi.me().pipe(map(toUser));
  }

  logout(): void {
    this.storage.removeItem(STORAGE_KEY);
    this._token.set(null);
  }
}
