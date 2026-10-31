import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService, TOKEN_STORAGE } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  const setup = (storedToken: string | null): void => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: TOKEN_STORAGE,
          useValue: {
            getItem: () => storedToken,
            setItem: () => undefined,
            removeItem: () => undefined,
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  };

  it('adds the bearer token outside /auth/**', () => {
    setup('the-token');
    http.get('/users/me').subscribe();

    expect(backend.expectOne('/users/me').request.headers.get('Authorization')).toBe(
      'Bearer the-token',
    );
  });

  it('does not add the token on /auth/**', () => {
    setup('the-token');
    http.post('/auth/login', {}).subscribe();

    expect(backend.expectOne('/auth/login').request.headers.has('Authorization')).toBe(false);
  });

  it('does not add a header without token', () => {
    setup(null);
    http.get('/users/me').subscribe();

    expect(backend.expectOne('/users/me').request.headers.has('Authorization')).toBe(false);
  });

  it('drops the token and goes to /connexion on a 401 outside /auth/**', () => {
    setup('the-token');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const errors: unknown[] = [];

    http.get('/users/me').subscribe({ error: (e) => errors.push(e) });
    backend.expectOne('/users/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/connexion']);
    expect(errors).toHaveLength(1);
  });

  it('keeps token and route on a 401 on /auth/**', () => {
    setup('the-token');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.post('/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.token()).toBe('the-token');
    expect(navigate).not.toHaveBeenCalled();
  });
});
