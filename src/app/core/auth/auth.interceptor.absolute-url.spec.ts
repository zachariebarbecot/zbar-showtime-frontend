import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';
import { TOKEN_STORAGE } from './auth.service';

describe('authInterceptor with an absolute apiUrl', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    environment.apiUrl = 'https://api.test';
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: TOKEN_STORAGE,
          useValue: {
            getItem: () => 'the-token',
            setItem: () => undefined,
            removeItem: () => undefined,
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    environment.apiUrl = '';
  });

  it('adds the bearer token on non-auth API calls', () => {
    http.get('https://api.test/users/me').subscribe();

    expect(
      backend.expectOne('https://api.test/users/me').request.headers.get('Authorization'),
    ).toBe('Bearer the-token');
  });

  it('does not add the token on /auth/**', () => {
    http.post('https://api.test/auth/login', {}).subscribe();

    expect(
      backend.expectOne('https://api.test/auth/login').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('keeps the route on a 401 on /auth/**', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.post('https://api.test/auth/login', {}).subscribe({ error: () => undefined });
    backend
      .expectOne('https://api.test/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('goes to /connexion on a 401 outside /auth/**', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('https://api.test/users/me').subscribe({ error: () => undefined });
    backend
      .expectOne('https://api.test/users/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).toHaveBeenCalledWith(['/connexion']);
  });

  it('ignores requests to another host: no token, no redirect on 401', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('https://autre-domaine.test/x').subscribe({ error: () => undefined });
    const request = backend.expectOne('https://autre-domaine.test/x');
    request.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
