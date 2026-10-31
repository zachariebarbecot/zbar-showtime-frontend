import { Injectable, InjectionToken, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const TOKEN_STORAGE = new InjectionToken<TokenStorage>('TOKEN_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string | null>(null);

  isAuthenticated(): boolean {
    return false;
  }

  login(email: string, password: string): Observable<void> {
    return of(undefined);
  }

  logout(): void {}
}
