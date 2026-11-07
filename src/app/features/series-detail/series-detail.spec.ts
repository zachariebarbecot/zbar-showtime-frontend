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
import { SeriesDetail } from './series-detail';

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe('SeriesDetail', () => {
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

  async function open(id: number | string = 1396) {
    const rendered = await render();
    await rendered.harness.navigateByUrl(`/serie/${id}`, SeriesDetail);
    rendered.http.expectOne('/users/me').flush(USER);
    rendered.harness.detectChanges();
    return { ...rendered, root: rendered.harness.routeNativeElement as HTMLElement };
  }

  describe('access', () => {
    it('should redirect a signed-out visitor to the login page', async () => {
      const { harness, http, router } = await render(false);

      await harness.navigateByUrl('/serie/1396');

      expect(router.url).toMatch(/^\/connexion/);
      http.expectNone('/series/1396');
    });
  });

  describe('loading', () => {
    it('should call the series endpoint once', async () => {
      const { http } = await open();

      expect(http.match('/series/1396')).toHaveLength(1);
    });

    it('should show a loading state until the series answers', async () => {
      const { harness, http, root } = await open();

      expect(root.querySelector('[role="status"]')?.textContent).toContain('Chargement');

      http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad' });
      await harness.fixture.whenStable();

      expect(root.querySelector('[role="status"]')).toBeNull();
    });
  });

  describe('details', () => {
    const BREAKING_BAD = {
      id: 1396,
      name: 'Breaking Bad',
      originalName: 'Breaking Bad VO',
      posterUrl: 'https://image.tmdb.org/t/p/w500/bb.jpg',
      genres: ['Drame', 'Crime'],
      overview: 'Un professeur de chimie devient fabricant de méthamphétamine.',
    };

    async function show(series: object) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush(series);
      await opened.harness.fixture.whenStable();
      return opened;
    }

    const text = (root: HTMLElement, selector: string) =>
      root.querySelector(selector)?.textContent?.trim();

    it('should show the poster, name, original name, genres and overview', async () => {
      const { root } = await show(BREAKING_BAD);

      expect(root.querySelector('img.md-poster')?.getAttribute('src')).toBe(BREAKING_BAD.posterUrl);
      expect(text(root, 'h1.md-title')).toBe('Breaking Bad');
      expect(text(root, '.md-original')).toBe('Breaking Bad VO');
      expect(
        [...root.querySelectorAll('.md-genres li')].map((li) => li.textContent?.trim()),
      ).toEqual(BREAKING_BAD.genres);
      expect(text(root, '.md-overview')).toBe(BREAKING_BAD.overview);
    });

    it('should hide the original name when it equals the name', async () => {
      const { root } = await show({ ...BREAKING_BAD, originalName: 'Breaking Bad' });

      expect(root.querySelector('.md-original')).toBeNull();
    });

    it('should render nothing for absent fields, with a placeholder for the poster', async () => {
      const { root } = await show({ id: 1396, name: 'Breaking Bad' });

      expect(text(root, 'h1.md-title')).toBe('Breaking Bad');
      expect(root.querySelector('img.md-poster')).toBeNull();
      expect(text(root, '.md-poster-empty')).toBe('Breaking Bad');
      for (const absent of ['.md-original', '.md-genres', '.md-overview']) {
        expect(root.querySelector(absent)).toBeNull();
      }
    });
  });
});
