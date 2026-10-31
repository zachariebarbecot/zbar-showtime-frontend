import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService, RegisterRequest, TOKEN_STORAGE } from './auth.service';

const STORAGE_KEY = 'token';

const jwt = (payload: object): string =>
  `h.${btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.s`;

const inSeconds = (delta: number): number => Math.floor(Date.now() / 1000) + delta;

describe('AuthService', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    store.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TOKEN_STORAGE, useValue: storage },
      ],
    });
  });

  const create = (): AuthService => TestBed.inject(AuthService);

  it('is authenticated with a stored token that has not expired', () => {
    storage.setItem(STORAGE_KEY, jwt({ exp: inSeconds(3600) }));

    expect(create().isAuthenticated()).toBe(true);
  });

  it('is not authenticated without token', () => {
    expect(create().isAuthenticated()).toBe(false);
  });

  it('is not authenticated and drops the token once it has expired', () => {
    storage.setItem(STORAGE_KEY, jwt({ exp: inSeconds(-1) }));
    const service = create();

    expect(service.isAuthenticated()).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('is not authenticated and drops a malformed token', () => {
    storage.setItem(STORAGE_KEY, 'not-a-jwt');
    const service = create();

    expect(service.isAuthenticated()).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('login posts the credentials and stores the returned token', () => {
    const service = create();
    const token = jwt({ exp: inSeconds(3600) });

    service.login('a@b.fr', 'secret').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'a@b.fr', password: 'secret' });
    request.flush({ token });

    expect(storage.getItem(STORAGE_KEY)).toBe(token);
    expect(service.token()).toBe(token);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('register posts the account fields', () => {
    const body: RegisterRequest = {
      firstName: 'Zoé',
      lastName: 'Martin',
      birthDate: '2000-02-29',
      gender: 'FEMALE',
      email: 'zoe@example.org',
      password: 'Abcdefghij1!',
    };
    let done = false;

    create()
      .register(body)
      .subscribe(() => (done = true));
    const request = TestBed.inject(HttpTestingController).expectOne('/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(null, { status: 201, statusText: 'Created' });

    expect(done).toBe(true);
  });

  it('logout removes the token', () => {
    storage.setItem(STORAGE_KEY, jwt({ exp: inSeconds(3600) }));
    const service = create();

    service.logout();

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('me reads the current user', () => {
    const user = { firstName: 'Zoé', lastName: 'Martin', email: 'zoe@example.org' };
    let received: unknown;

    create()
      .me()
      .subscribe((value) => (received = value));
    const request = TestBed.inject(HttpTestingController).expectOne('/users/me');
    expect(request.request.method).toBe('GET');
    request.flush(user);

    expect(received).toEqual(user);
  });
});
