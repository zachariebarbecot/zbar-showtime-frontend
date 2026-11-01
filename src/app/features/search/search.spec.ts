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

  function type(rendered: Awaited<ReturnType<typeof open>>, value: string) {
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
      expect(searchCalls(http)).toHaveLength(0);
    });

    it('should not render the header before /users/me answers', async () => {
      const { harness, http } = await render();

      await harness.navigateByUrl('/recherche', Search);
      const root = harness.routeNativeElement as HTMLElement;

      expect(root.querySelector('header')).toBeNull();
      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();
      expect(root.querySelector('header')).not.toBeNull();
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

  describe('type filter', () => {
    const chips = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]'));

    it('should show the three chips under the field with "Tout" selected by default', async () => {
      const { root } = await open();

      expect(chips(root).map((chip) => chip.textContent?.trim())).toEqual([
        'Tout',
        'Films',
        'Séries',
      ]);
      expect(chips(root).map((chip) => chip.getAttribute('aria-checked'))).toEqual([
        'true',
        'false',
        'false',
      ]);
    });

    async function choose(rendered: Awaited<ReturnType<typeof open>>, label: string) {
      const chip = chips(rendered.root).find(
        (candidate) => candidate.textContent?.trim() === label,
      );
      chip?.click();
      await settle(rendered);
    }

    async function searchDune(rendered: Awaited<ReturnType<typeof open>>) {
      vi.useFakeTimers();
      type(rendered, 'dune');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);
    }

    it.each([
      ['Films', 'movie'],
      ['Séries', 'tv'],
    ])(
      'should search again with type=%s mapped to %s, page 1 and the same input',
      async (label, type) => {
        const rendered = await open();
        await searchDune(rendered);

        await choose(rendered, label);

        const request = rendered.http.expectOne((req) => req.url === '/search');
        expect(request.request.params.get('type')).toBe(type);
        expect(request.request.params.get('page')).toBe('1');
        expect(request.request.params.get('query')).toBe('dune');
        request.flush({
          page: 1,
          totalPages: 1,
          totalResults: 1,
          results: [{ id: 1, title: 'Dune', type: 'MOVIE' }],
        });
        rendered.harness.detectChanges();
        const titles = Array.from(rendered.root.querySelectorAll('.zb-poster-title'));
        expect(titles.map((title) => title.textContent)).toEqual(['Dune']);
      },
    );

    it('should search without type when going back to "Tout"', async () => {
      const rendered = await open();
      await searchDune(rendered);
      await choose(rendered, 'Films');
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);

      await choose(rendered, 'Tout');

      const request = rendered.http.expectOne((req) => req.url === '/search');
      expect(request.request.params.has('type')).toBe(false);
    });

    it('should cancel the call in flight when the chip changes', async () => {
      const rendered = await open();
      await searchDune(rendered);
      await choose(rendered, 'Films');
      const first = rendered.http.expectOne((req) => req.url === '/search');

      await choose(rendered, 'Séries');
      const second = rendered.http.expectOne((req) => req.url === '/search');
      second.flush({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [{ id: 2, title: 'Dune: Prophecy', type: 'TV' }],
      });
      rendered.harness.detectChanges();

      expect(first.cancelled).toBe(true);
      expect(second.request.params.get('type')).toBe('tv');
      const titles = Array.from(rendered.root.querySelectorAll('.zb-poster-title'));
      expect(titles.map((title) => title.textContent)).toEqual(['Dune: Prophecy']);
    });

    it('should not search and keep the prompt when the chip changes with less than 2 characters', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'd');
      await settle(rendered);

      await choose(rendered, 'Films');

      expect(searchCalls(rendered.http)).toHaveLength(0);
      expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
    });
  });

  describe('searching', () => {
    it('should call search once with the trimmed input, page 1 and no type, 300 ms after the last key', async () => {
      const rendered = await open();
      vi.useFakeTimers();

      for (const value of ['d', 'du', 'dun', '  dune ']) {
        type(rendered, value);
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

      type(rendered, 'dune');
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

        type(rendered, value);
        await settle(rendered);

        expect(searchCalls(rendered.http)).toHaveLength(0);
        expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
      },
    );

    it('should bring the prompt back when the input shrinks below 2 characters', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'dune');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);

      type(rendered, 'd');
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
      type(rendered, value);
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

      expect(rendered.root.querySelectorAll('.sr-grid a, .sr-grid button')).toHaveLength(0);
      expect(rendered.root.querySelector('.zb-empty')).toBeNull();
    });
  });

  describe('no result', () => {
    it('should name the trimmed input in a no result message, without grid', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, '  zzzz ');
      await settle(rendered);

      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);
      rendered.harness.detectChanges();

      expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain(
        'Aucun résultat pour "zzzz"',
      );
      expect(rendered.root.querySelector('.zb-empty')?.textContent).not.toContain('2 caractères');
      expect(rendered.root.querySelector('.zb-poster')).toBeNull();
    });
  });

  describe('changing the input and failures', () => {
    it('should cancel the call in flight and show only the results of the new input', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'du');
      await settle(rendered);
      const first = rendered.http.expectOne((req) => req.url === '/search');

      type(rendered, 'dune');
      await settle(rendered);
      const second = rendered.http.expectOne((req) => req.url === '/search');
      second.flush({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [{ id: 1, title: 'Dune', type: 'MOVIE' }],
      });
      rendered.harness.detectChanges();

      expect(first.cancelled).toBe(true);
      expect(second.request.params.get('query')).toBe('dune');
      const titles = Array.from(rendered.root.querySelectorAll('.zb-poster-title'));
      expect(titles.map((title) => title.textContent)).toEqual(['Dune']);
    });

    it.each([
      ['a network error', { status: 0, statusText: 'Unknown Error' }],
      ['a 400', { status: 400, statusText: 'Bad Request' }],
      ['a 500', { status: 500, statusText: 'Server Error' }],
    ])('should show a generic message on %s, without detail nor trace id', async (_label, init) => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'dune');
      await settle(rendered);

      rendered.http
        .expectOne((req) => req.url === '/search')
        .flush({ detail: 'secret detail', traceId: 'trace-123' }, init);
      rendered.harness.detectChanges();

      const alert = query(rendered.root, '[role="alert"]');
      expect(alert.textContent).toContain('La recherche a échoué');
      expect(rendered.root.textContent).not.toContain('secret detail');
      expect(rendered.root.textContent).not.toContain('trace-123');
      expect(rendered.root.textContent).not.toContain('Aucun résultat');
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();
      expect(rendered.root.querySelector('.zb-poster')).toBeNull();
    });

    it('should keep searching after a failure', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'dune');
      await settle(rendered);
      rendered.http
        .expectOne((req) => req.url === '/search')
        .flush(null, { status: 500, statusText: 'Server Error' });

      type(rendered, 'arrakis');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);
      rendered.harness.detectChanges();

      expect(rendered.root.querySelector('[role="alert"]')).toBeNull();
      expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain(
        'Aucun résultat pour "arrakis"',
      );
    });
  });
});
