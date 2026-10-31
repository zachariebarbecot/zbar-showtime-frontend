import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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

export type Gender = 'MALE' | 'FEMALE';

export interface RegisterRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly gender: Gender;
  readonly email: string;
  readonly password: string;
}

interface LoginResponse {
  readonly token: string;
}

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
  private readonly http = inject(HttpClient);
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
    return this.http.post<LoginResponse>(`${authUrl()}login`, { email, password }).pipe(
      tap(({ token }) => {
        this.storage.setItem(STORAGE_KEY, token);
        this._token.set(token);
      }),
      map(() => undefined),
    );
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${authUrl()}register`, request);
  }

  logout(): void {
    this.storage.removeItem(STORAGE_KEY);
    this._token.set(null);
  }
}
