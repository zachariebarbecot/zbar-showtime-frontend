import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideApiConfiguration } from '../../api/api-configuration';
import { routes } from '../../app.routes';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { MovieDetail } from './movie-detail';

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe('MovieDetail', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    store.clear();
  });

  async function render(signedIn = true) {
    if (signedIn) store.set('token', validToken);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideApiConfiguration(''),
        provideRouter(routes),
        { provide: TOKEN_STORAGE, useValue: storage },
      ],
    });
    const harness = await RouterTestingHarness.create();
    const http = TestBed.inject(HttpTestingController);
    return { harness, http, router: TestBed.inject(Router) };
  }

  async function open(id = 603) {
    const rendered = await render();
    await rendered.harness.navigateByUrl(`/film/${id}`, MovieDetail);
    rendered.http.expectOne('/users/me').flush(USER);
    rendered.harness.detectChanges();
    return { ...rendered, root: rendered.harness.routeNativeElement as HTMLElement };
  }

  describe('access', () => {
    it('should redirect a signed-out visitor to the login page', async () => {
      const { harness, http, router } = await render(false);

      await harness.navigateByUrl('/film/603');

      expect(router.url).toMatch(/^\/connexion/);
      http.expectNone('/movies/603');
    });
  });

  describe('loading', () => {
    it('should call the movie endpoint once', async () => {
      const { http } = await open();

      expect(http.match('/movies/603')).toHaveLength(1);
    });

    it('should show a loading state until the movie answers', async () => {
      const { harness, http, root } = await open();

      expect(root.querySelector('[role="status"]')?.textContent).toContain('Chargement');

      http.expectOne('/movies/603').flush({ id: 603, title: 'Matrix' });
      harness.detectChanges();

      expect(root.querySelector('[role="status"]')).toBeNull();
    });
  });
});
