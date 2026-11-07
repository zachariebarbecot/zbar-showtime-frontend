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
      await harness.fixture.whenStable();

      expect(root.querySelector('[role="status"]')).toBeNull();
    });
  });

  describe('details', () => {
    const MATRIX = {
      id: 603,
      title: 'Matrix',
      originalTitle: 'The Matrix',
      posterUrl: 'https://image.tmdb.org/t/p/w500/matrix.jpg',
      releaseDate: '1999-03-31',
      runtime: 136,
      genres: ['Action', 'Science-Fiction'],
      overview: 'Un hacker découvre la vraie nature de son monde.',
    };

    async function show(movie: object) {
      const opened = await open();
      opened.http.expectOne('/movies/603').flush(movie);
      await opened.harness.fixture.whenStable();
      return opened;
    }

    const text = (root: HTMLElement, selector: string) =>
      root.querySelector(selector)?.textContent?.trim();

    it('should show the poster, title, year, runtime, genres and overview', async () => {
      const { root } = await show(MATRIX);

      expect(root.querySelector('img.md-poster')?.getAttribute('src')).toBe(MATRIX.posterUrl);
      expect(text(root, 'h1.md-title')).toBe('Matrix');
      expect(text(root, '.md-meta')).toContain('1999');
      expect(text(root, '.md-meta')).toContain('136 min');
      expect(
        [...root.querySelectorAll('.md-genres li')].map((li) => li.textContent?.trim()),
      ).toEqual(MATRIX.genres);
      expect(text(root, '.md-overview')).toBe(MATRIX.overview);
    });

    it('should render nothing for absent fields, with a placeholder for the poster', async () => {
      const { root } = await show({ id: 603, title: 'Matrix' });

      expect(text(root, 'h1.md-title')).toBe('Matrix');
      expect(root.querySelector('img.md-poster')).toBeNull();
      expect(text(root, '.md-poster-empty')).toBe('Matrix');
      for (const absent of ['.md-original', '.md-meta', '.md-genres', '.md-overview']) {
        expect(root.querySelector(absent)).toBeNull();
      }
    });

    it('should show only the year when the runtime is absent, and only the runtime when the date is', async () => {
      const withoutRuntime = await show({ ...MATRIX, runtime: undefined });
      expect(text(withoutRuntime.root, '.md-meta')).toBe('1999');
      TestBed.resetTestingModule();

      const withoutDate = await show({ ...MATRIX, releaseDate: undefined });
      expect(text(withoutDate.root, '.md-meta')).toBe('136 min');
    });
  });

  describe('original title', () => {
    async function showTitles(title: string, originalTitle?: string) {
      const opened = await open();
      opened.http.expectOne('/movies/603').flush({ id: 603, title, originalTitle });
      await opened.harness.fixture.whenStable();
      return opened.root.querySelector('.md-original')?.textContent?.trim();
    }

    it('should show the original title when it differs from the title', async () => {
      expect(await showTitles('Matrix', 'The Matrix')).toBe('The Matrix');
    });

    it('should hide the original title when it equals the title', async () => {
      expect(await showTitles('Matrix', 'Matrix')).toBeUndefined();
    });
  });

  describe('back link', () => {
    it('should go back to the search page', async () => {
      const { harness, http, root, router } = await open();
      http.expectOne('/movies/603').flush({ id: 603, title: 'Matrix' });
      await harness.fixture.whenStable();

      const back = root.querySelector<HTMLAnchorElement>('a.md-back');
      expect(back?.textContent).toContain('Retour');
      back?.click();
      await harness.fixture.whenStable();

      expect(router.url).toBe('/recherche');
    });
  });
});
