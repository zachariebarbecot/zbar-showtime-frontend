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

  it('should expose the search bar as a search landmark', async () => {
    const { root } = await open();

    expect(root.querySelector('[role="search"] input[type="search"]')).not.toBeNull();
  });

  it('should name the chips "Filtrer" for assistive technologies only', async () => {
    const { root } = await open();

    const label = root.querySelector<HTMLElement>('.zb-search-scopes .zb-field-label');
    expect(label?.textContent?.trim()).toBe('Filtrer');
    expect(label?.classList).toContain('zb-sr');
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
      ['Films', 'MOVIE'],
      ['Séries', 'TV'],
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

    it('should search with type=ALL when going back to "Tout"', async () => {
      const rendered = await open();
      await searchDune(rendered);
      await choose(rendered, 'Films');
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);

      await choose(rendered, 'Tout');

      const request = rendered.http.expectOne((req) => req.url === '/search');
      expect(request.request.params.get('type')).toBe('ALL');
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
      expect(second.request.params.get('type')).toBe('TV');
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
    it('should call search once with the trimmed input, page 1 and type=ALL, 300 ms after the last key', async () => {
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
      expect(request.request.params.get('type')).toBe('ALL');
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

    it('should show one poster per usable result with image, title and year only', async () => {
      const rendered = await open();

      await searchFor(rendered, 'dune', RESULTS);

      const posters = Array.from(rendered.root.querySelectorAll('.zb-poster'));
      expect(
        posters.map((poster) => poster.querySelector('.zb-poster-title')?.textContent),
      ).toEqual(['Dune', 'Dune: Prophecy', 'Dune, le film']);
      expect(posters.map((poster) => poster.querySelector('.zb-poster-meta')?.textContent)).toEqual(
        ['2021', '2024', undefined],
      );
      expect(posters[0].querySelector('img')?.getAttribute('src')).toBe(
        'https://img.exemple.fr/dune.jpg',
      );
    });

    it.each([
      ['TO_WATCH', 'Watchlist'],
      ['WATCHED', 'Vu'],
      ['WATCHING', 'En cours'],
      ['DROPPED', 'Abandonné'],
    ])(
      'should badge a result with status %s as %s, with an icon',
      async (watchlistStatus, word) => {
        const rendered = await open();

        await searchFor(rendered, 'dune', {
          ...RESULTS,
          results: [{ id: 1, title: 'Dune', type: 'MOVIE', watchlistStatus }],
        });

        const badge = query(rendered.root, '.zb-poster .zb-badge');
        expect(badge.textContent?.trim()).toBe(word);
        expect(badge.querySelector('svg path')?.getAttribute('d')).toBeTruthy();
      },
    );

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

    it('should say what to do and offer to clear the search', async () => {
      const rendered = await open();
      vi.useFakeTimers();
      type(rendered, 'zzzz');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(EMPTY_RESPONSE);
      rendered.harness.detectChanges();

      const empty = rendered.root.querySelector<HTMLElement>('.zb-empty');
      expect(empty?.querySelector('.zb-empty-text')?.textContent).toContain('autre titre');
      const clear = Array.from(empty?.querySelectorAll('button') ?? []).find(
        (button) => button.textContent?.trim() === 'Effacer la recherche',
      );
      expect(clear).toBeDefined();
      clear?.click();
      await settle(rendered);

      expect(rendered.root.querySelector<HTMLInputElement>('input[type="search"]')?.value).toBe('');
      expect(rendered.root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
      expect(searchCalls(rendered.http)).toHaveLength(0);
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

  describe('load more', () => {
    const page = (current: number, totalPages: number, results: object[] = []) => ({
      page: current,
      totalPages,
      totalResults: 42,
      results,
    });
    const DUNE = { id: 1, title: 'Dune', type: 'MOVIE' };

    async function searchFor(rendered: Awaited<ReturnType<typeof open>>, response: object) {
      vi.useFakeTimers();
      type(rendered, 'dune');
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(response);
      rendered.harness.detectChanges();
    }

    const loadMoreButton = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('main button')).find(
        (button) => button.textContent?.trim() === 'Charger plus',
      );

    it('should show the button when page is below totalPages', async () => {
      const rendered = await open();

      await searchFor(rendered, page(1, 3, [DUNE]));

      expect(loadMoreButton(rendered.root)).toBeDefined();
    });

    it('should hide the button when page equals totalPages', async () => {
      const rendered = await open();

      await searchFor(rendered, page(1, 1, [DUNE]));

      expect(loadMoreButton(rendered.root)).toBeUndefined();
    });

    const titles = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('.zb-poster-title')).map((title) => title.textContent);

    it('should call search with page 2, same input and type, and append the results', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));

      loadMoreButton(rendered.root)?.click();

      const request = rendered.http.expectOne((req) => req.url === '/search');
      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('query')).toBe('dune');
      expect(request.request.params.get('type')).toBe('ALL');
      request.flush(page(2, 3, [{ id: 2, title: 'Dune 2', type: 'MOVIE' }]));
      rendered.harness.detectChanges();
      expect(titles(rendered.root)).toEqual(['Dune', 'Dune 2']);
    });

    it('should keep the type filter when loading more', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));
      const chip = rendered.root.querySelectorAll<HTMLElement>('[role="radio"]')[1];
      chip.click();
      await settle(rendered);
      rendered.http.expectOne((req) => req.url === '/search').flush(page(1, 3, [DUNE]));
      rendered.harness.detectChanges();

      loadMoreButton(rendered.root)?.click();

      const request = rendered.http.expectOne((req) => req.url === '/search');
      expect(request.request.params.get('type')).toBe('MOVIE');
      expect(request.request.params.get('page')).toBe('2');
    });

    it('should show a loading indicator and keep the grid during the call', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));

      loadMoreButton(rendered.root)?.click();
      rendered.harness.detectChanges();

      expect(rendered.root.querySelector('[role="status"]')).not.toBeNull();
      expect(titles(rendered.root)).toEqual(['Dune']);
      rendered.http.expectOne((req) => req.url === '/search').flush(page(2, 3, []));
      rendered.harness.detectChanges();
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();
    });

    it('should hide the button once the last page is loaded', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 2, [DUNE]));

      loadMoreButton(rendered.root)?.click();
      rendered.http
        .expectOne((req) => req.url === '/search')
        .flush(page(2, 2, [{ id: 2, title: 'Dune 2', type: 'MOVIE' }]));
      rendered.harness.detectChanges();

      expect(loadMoreButton(rendered.root)).toBeUndefined();
    });

    it('should not show twice a result with the same id and type, but keep the same id with another type', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));

      loadMoreButton(rendered.root)?.click();
      rendered.http
        .expectOne((req) => req.url === '/search')
        .flush(
          page(2, 3, [
            DUNE,
            { id: 1, title: 'Dune (série)', type: 'TV' },
            { id: 2, title: 'Dune 2', type: 'MOVIE' },
          ]),
        );
      rendered.harness.detectChanges();

      expect(titles(rendered.root)).toEqual(['Dune', 'Dune (série)', 'Dune 2']);
    });

    it('should ignore a late page when the input changes and restart from page 1', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));
      loadMoreButton(rendered.root)?.click();
      const late = rendered.http.expectOne((req) => req.url === '/search');

      type(rendered, 'arrakis');
      await settle(rendered);
      const fresh = rendered.http.expectOne((req) => req.url === '/search');
      expect(fresh.request.params.get('page')).toBe('1');
      expect(fresh.request.params.get('query')).toBe('arrakis');
      fresh.flush(page(1, 2, [{ id: 3, title: 'Arrakis', type: 'MOVIE' }]));
      late.flush(page(2, 3, [{ id: 9, title: 'Tardif', type: 'MOVIE' }]));
      rendered.harness.detectChanges();

      expect(titles(rendered.root)).toEqual(['Arrakis']);
      expect(rendered.root.querySelector('[role="status"]')).toBeNull();
    });

    it('should ignore a late page when the filter changes and restart from page 1', async () => {
      const rendered = await open();
      await searchFor(rendered, page(1, 3, [DUNE]));
      loadMoreButton(rendered.root)?.click();
      const late = rendered.http.expectOne((req) => req.url === '/search');

      rendered.root.querySelectorAll<HTMLElement>('[role="radio"]')[2].click();
      await settle(rendered);
      const fresh = rendered.http.expectOne((req) => req.url === '/search');
      expect(fresh.request.params.get('type')).toBe('TV');
      expect(fresh.request.params.get('page')).toBe('1');
      fresh.flush(page(1, 1, [{ id: 4, title: 'Série', type: 'TV' }]));
      late.flush(page(2, 3, [{ id: 9, title: 'Tardif', type: 'MOVIE' }]));
      rendered.harness.detectChanges();

      expect(titles(rendered.root)).toEqual(['Série']);
    });

    it.each([
      ['a network error', { status: 0, statusText: 'Unknown Error' }],
      ['a 400', { status: 400, statusText: 'Bad Request' }],
      ['a 500', { status: 500, statusText: 'Server Error' }],
    ])(
      'should show a generic message on %s, keep the results and retry the same page',
      async (_label, init) => {
        const rendered = await open();
        await searchFor(rendered, page(1, 3, [DUNE]));
        loadMoreButton(rendered.root)?.click();

        rendered.http
          .expectOne((req) => req.url === '/search')
          .flush({ detail: 'secret detail' }, init);
        rendered.harness.detectChanges();

        expect(query(rendered.root, '[role="alert"]').textContent).toContain(
          'Le chargement a échoué',
        );
        expect(rendered.root.textContent).not.toContain('secret detail');
        expect(rendered.root.querySelector('[role="status"]')).toBeNull();
        expect(titles(rendered.root)).toEqual(['Dune']);
        expect(loadMoreButton(rendered.root)?.disabled).toBe(false);

        loadMoreButton(rendered.root)?.click();
        rendered.harness.detectChanges();
        const retry = rendered.http.expectOne((req) => req.url === '/search');
        expect(retry.request.params.get('page')).toBe('2');
        retry.flush(page(2, 3, [{ id: 2, title: 'Dune 2', type: 'MOVIE' }]));
        rendered.harness.detectChanges();
        expect(titles(rendered.root)).toEqual(['Dune', 'Dune 2']);
        expect(rendered.root.querySelector('[role="alert"]')).toBeNull();
      },
    );
  });
});
