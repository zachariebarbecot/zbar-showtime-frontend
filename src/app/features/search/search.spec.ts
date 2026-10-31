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
import { query } from '../../testing/query';
import { Search } from './search';

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe('Search', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    store.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  async function open() {
    const rendered = await render();
    const page = await rendered.harness.navigateByUrl('/recherche', Search);
    rendered.http.expectOne('/users/me').flush(USER);
    await rendered.harness.fixture.whenStable();
    return { ...rendered, page, root: rendered.harness.routeNativeElement as HTMLElement };
  }

  const EMPTY_RESPONSE = { page: 1, results: [], totalPages: 1, totalResults: 0 };

  async function type(rendered: Awaited<ReturnType<typeof open>>, value: string) {
    const input = query<HTMLInputElement>(rendered.root, 'main input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function settle(rendered: Awaited<ReturnType<typeof open>>, ms = 300) {
    await vi.advanceTimersByTimeAsync(ms);
    rendered.harness.detectChanges();
  }

  const searchCalls = (http: HttpTestingController) => http.match((req) => req.url === '/search');

  describe('opening the page', () => {
    it('should invite to type, without calling search', async () => {
      const { root, http } = await open();

      expect(root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
      expect(http.match((req) => req.url === '/search')).toHaveLength(0);
    });

    it('should mark Recherche as the current header link, not Accueil', async () => {
      const { root } = await open();

      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('header nav a'));
      const byLabel = (label: string) => links.find((link) => link.textContent?.trim() === label);
      expect(byLabel('Recherche')?.getAttribute('aria-current')).toBe('page');
      expect(byLabel('Accueil')?.hasAttribute('aria-current')).toBe(false);
    });

    it('should show the signed in user in the header', async () => {
      const { root } = await open();

      expect(root.querySelector('header button[aria-haspopup]')?.textContent).toContain(
        'Camille Durand',
      );
    });

    it('should redirect a visitor who is not signed in to the login with the return url', async () => {
      const { harness, router } = await render(false);

      await harness.navigateByUrl('/recherche');

      expect(router.url).toBe('/connexion?returnUrl=%2Frecherche');
    });
  });

  describe('searching', () => {
    it('should call search once with the trimmed input, page 1 and no type, 300 ms after the last key', async () => {
      const rendered = await open();
      vi.useFakeTimers();

      for (const value of ['d', 'du', 'dun', '  dune ']) {
        await type(rendered, value);
        await settle(rendered, 100);
      }
      expect(searchCalls(rendered.http)).toHaveLength(0);
      await settle(rendered, 200);

      const request = rendered.http.expectOne((req) => req.url === '/search');
      expect(request.request.params.get('query')).toBe('dune');
      expect(request.request.params.get('page')).toBe('1');
      expect(request.request.params.has('type')).toBe(false);
    });

    it('should show a loading indicator during the call, then remove it', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();

      await type(rendered, 'dune');
      await settle(rendered);

      expect(rendered.root.querySelector('[role="status"]')).not.toBeNull();
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);
      rendered.harness.detectChanges();
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();
    });

    it.each(['d', '  d  ', '   '])(
      'should not call search for "%s" and keep the prompt',
      async (value) => {
        const rendered = await open();
        vi.useFakeTimers();

        await type(rendered, value);
        await settle(rendered);

        expect(searchCalls(rendered.http)).toHaveLength(0);
        expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
      },
    );

    it('should bring the prompt back when the input shrinks below 2 characters', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      await type(rendered, 'dune');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);

      await type(rendered, 'd');
      await settle(rendered);

      expect(searchCalls(rendered.http)).toHaveLength(0);
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();
      expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
    });
  });

  describe('results', () => {
    const RESULTS = {
      page: 1,
      totalPages: 3,
      totalResults: 42,
      results: [
        {
          id: 1,
          title: 'Dune',
          type: 'MOVIE',
          releaseDate: '2021-09-15',
          posterUrl: 'https://img.exemple.fr/dune.jpg',
        },
        { id: 2, title: 'Dune: Prophecy', type: 'TV', releaseDate: '2024-11-17' },
        { id: 3, title: 'Dune, le film', type: 'MOVIE' },
        { title: 'Sans identifiant', type: 'MOVIE', releaseDate: '2000-01-01' },
        { id: 5, type: 'TV', releaseDate: '2000-01-01' },
      ],
    };

    async function searchFor(
      rendered: Awaited<ReturnType<typeof open>>,
      value: string,
      response: object,
    ) {
      vi.useFakeTimers();
      await type(rendered, value);
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(response);
      rendered.harness.detectChanges();
    }

    it('should show one poster per usable result with image, title and kind with year', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', RESULTS);

      const posters = Array.from(rendered.root.querySelectorAll('.zb-poster'));
      expect(
        posters.map((poster) => poster.querySelector('.zb-poster-title')?.textContent),
      ).toEqual(['Dune', 'Dune: Prophecy', 'Dune, le film']);
      expect(posters.map((poster) => poster.querySelector('.zb-poster-meta')?.textContent)).toEqual(
        ['Film · 2021', 'Série · 2024', 'Film'],
      );
      expect(posters[0].querySelector('img')?.getAttribute('src')).toBe(
        'https://img.exemple.fr/dune.jpg',
      );
    });

    it('should fall back to the poster without image when a result has none', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', RESULTS);

      const poster = rendered.root.querySelectorAll('.zb-poster')[1];
      expect(poster.querySelector('img')).toBeNull();
      expect(poster.querySelector('.zb-poster-title')?.textContent).toBe('Dune: Prophecy');
    });

    it('should show the total number of results', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', RESULTS);

      expect(rendered.root.querySelector('main')?.textContent).toContain('42 résultats');
    });

    it('should use the singular for a single result', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', {
        ...RESULTS,
        totalResults: 1,
        results: [RESULTS.results[0]],
      });

      expect(rendered.root.querySelector('main')?.textContent).toContain('1 résultat');
      expect(rendered.root.querySelector('main')?.textContent).not.toContain('1 résultats');
    });

    it('should not make the results clickable and hide the prompt', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', RESULTS);

      expect(rendered.root.querySelectorAll('main a, main button')).toHaveLength(0);
      expect(rendered.root.querySelector('.zb-empty')).toBeNull();
    });
  });
});
