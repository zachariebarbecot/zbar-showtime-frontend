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

  async function open(id = '1396') {
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

  describe('counts', () => {
    async function meta(series: object) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad', ...series });
      await opened.harness.fixture.whenStable();
      return opened.root.querySelector('.md-meta')?.textContent?.trim();
    }

    it('should show the season and episode counts in the plural', async () => {
      expect(await meta({ numberOfSeasons: 5, numberOfEpisodes: 62 })).toBe(
        '5 saisons · 62 épisodes',
      );
    });

    it('should show the season and episode counts in the singular for 1', async () => {
      expect(await meta({ numberOfSeasons: 1, numberOfEpisodes: 1 })).toBe('1 saison · 1 épisode');
    });

    it('should show only the season count when the episode count is absent', async () => {
      expect(await meta({ numberOfSeasons: 5 })).toBe('5 saisons');
    });

    it('should show only the episode count when the season count is absent', async () => {
      expect(await meta({ numberOfEpisodes: 62 })).toBe('62 épisodes');
    });

    it('should render no meta when both counts are absent', async () => {
      expect(await meta({})).toBeUndefined();
    });
  });

  describe('not found', () => {
    it('should show the not found empty state with a link to the search page on a 404', async () => {
      const { harness, http, root } = await open();
      http.expectOne('/series/1396').flush('', { status: 404, statusText: 'Error' });
      await harness.fixture.whenStable();

      expect(root.querySelector('.zb-empty-title')?.textContent).toContain('Série introuvable');
      expect(root.querySelector('a[href="/recherche"].zb-button')).not.toBeNull();
      expect(root.querySelector('.md-hero')).toBeNull();
    });
  });

  describe('invalid id', () => {
    it.each(['abc', '0', '-3', '1.5'])(
      'should show the not found empty state without calling the API for id %s',
      async (id) => {
        const { harness, http, root } = await open(id);
        await harness.fixture.whenStable();

        http.expectNone((request) => request.url.startsWith('/series/'));
        expect(root.querySelector('.zb-empty-title')?.textContent).toContain('Série introuvable');
        expect(root.querySelector('[role="status"]')).toBeNull();
      },
    );

    it('should show the not found empty state on a 400', async () => {
      const { harness, http, root } = await open();
      http.expectOne('/series/1396').flush('', { status: 400, statusText: 'Error' });
      await harness.fixture.whenStable();

      expect(root.querySelector('.zb-empty-title')?.textContent).toContain('Série introuvable');
      expect(root.querySelector('.md-hero')).toBeNull();
    });
  });

  describe('server error', () => {
    it.each([500, 0])('should show an error message and a retry button on a %i', async (status) => {
      const { harness, http, root } = await open();
      http.expectOne('/series/1396').flush('', { status, statusText: 'Error' });
      await harness.fixture.whenStable();

      expect(root.querySelector('[role="alert"]')).not.toBeNull();
      expect(root.querySelector('main button')?.textContent).toContain('Réessayer');
      expect(root.querySelector('.zb-empty-title')).toBeNull();
    });
  });

  describe('retry', () => {
    it('should call the series endpoint again and show the details on success', async () => {
      const { harness, http, root } = await open();
      http.expectOne('/series/1396').flush('', { status: 500, statusText: 'Error' });
      await harness.fixture.whenStable();

      root.querySelector<HTMLButtonElement>('main button')?.click();
      harness.detectChanges();
      http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad' });
      await harness.fixture.whenStable();

      expect(root.querySelector('h1.md-title')?.textContent?.trim()).toBe('Breaking Bad');
      expect(root.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('airing', () => {
    async function airing(series: object) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad', ...series });
      await opened.harness.fixture.whenStable();
      return opened.root;
    }

    const tag = (root: HTMLElement) =>
      root.querySelector('app-show-status .zb-tag')?.textContent?.trim();

    it.each([
      ['RETURNING', 'En cours'],
      ['IN_PRODUCTION', 'En production'],
      ['PLANNED', 'Prévue'],
      ['PILOT', 'Pilote'],
      ['ENDED', 'Terminée'],
      ['CANCELED', 'Annulée'],
    ])('should show the %s status as « %s »', async (status, label) => {
      expect(tag(await airing({ status }))).toBe(label);
    });

    const period = (root: HTMLElement) => root.querySelector('.md-period')?.textContent?.trim();

    it.each(['RETURNING', 'IN_PRODUCTION', 'PLANNED', 'PILOT'])(
      'should show an open period for the open status %s',
      async (status) => {
        expect(period(await airing({ status, firstAirDate: '2019-03-14' }))).toBe('2019 –');
      },
    );

    it.each(['ENDED', 'CANCELED'])(
      'should show the closed period for the closed status %s',
      async (status) => {
        const root = await airing({
          status,
          firstAirDate: '2019-03-14',
          lastAirDate: '2023-11-02',
        });

        expect(period(root)).toBe('2019–2023');
      },
    );

    it('should show a single year when both dates are in the same year', async () => {
      const root = await airing({
        status: 'CANCELED',
        firstAirDate: '2019-03-14',
        lastAirDate: '2019-12-20',
      });

      expect(period(root)).toBe('2019');
    });

    it.each([{}, { status: 'UNKNOWN' }, { status: 'toString' }])(
      'should render no tag for the status %j',
      async (series) => {
        const root = await airing(series);

        expect(root.querySelector('app-show-status')).toBeNull();
      },
    );

    it('should render no period when the first air date is absent', async () => {
      const root = await airing({ status: 'RETURNING', lastAirDate: '2023-11-02' });

      expect(root.querySelector('.md-period')).toBeNull();
      expect(tag(root)).toBe('En cours');
    });
  });

  describe('credits', () => {
    async function show(series: object) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad', ...series });
      await opened.harness.fixture.whenStable();
      return opened.root;
    }

    it.each([[[]], [undefined]])(
      'should hide the creators section when creators is %j',
      async (creators) => {
        const root = await show({ creators });

        expect(root.querySelector('.md-directors')).toBeNull();
      },
    );

    it('should list every creator', async () => {
      const root = await show({ creators: ['Vince Gilligan', 'Peter Gould'] });

      expect(root.querySelector('.md-directors h2')?.textContent).toContain('Création');
      expect(
        [...root.querySelectorAll('.md-directors li')].map((li) => li.textContent?.trim()),
      ).toEqual(['Vince Gilligan', 'Peter Gould']);
    });

    const CAST = [
      { name: 'Bryan Cranston', character: 'Walter White' },
      { name: 'Aaron Paul', character: 'Jesse Pinkman' },
    ];

    it('should render one cast card per member with name and character', async () => {
      const root = await show({ cast: CAST });

      expect(root.querySelector('.md-cast h2')?.textContent).toContain('Casting');
      const cards = [...root.querySelectorAll('.md-cast app-cast-card')];
      expect(
        cards.map((card) => [
          card.querySelector('.zb-cast-name')?.textContent,
          card.querySelector('.zb-cast-role')?.textContent,
        ]),
      ).toEqual([
        ['Bryan Cranston', 'Walter White'],
        ['Aaron Paul', 'Jesse Pinkman'],
      ]);
    });
  });

  describe('back link', () => {
    it('should go back to the search page', async () => {
      const { harness, http, root, router } = await open();
      http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad' });
      await harness.fixture.whenStable();

      const back = root.querySelector<HTMLAnchorElement>('a.md-back');
      expect(back?.textContent).toContain('Retour');
      back?.click();
      await harness.fixture.whenStable();

      expect(router.url).toBe('/recherche');
    });
  });
});
