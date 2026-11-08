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
import { ToastService } from '../../ui/toast/toast.service';
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

    it('should show the poster, name, original name and overview', async () => {
      const { root } = await show(BREAKING_BAD);

      expect(root.querySelector('img.md-poster')?.getAttribute('src')).toBe(BREAKING_BAD.posterUrl);
      expect(text(root, 'h1.md-title')).toBe('Breaking Bad');
      expect(text(root, '.md-original')).toBe('Breaking Bad VO');
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
      for (const absent of ['.md-original', '.md-overview']) {
        expect(root.querySelector(absent)).toBeNull();
      }
    });
  });

  describe('meta line', () => {
    const FULL = {
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      genres: ['Drame', 'Crime'],
      status: 'ENDED',
      firstAirDate: '2008-01-20',
      lastAirDate: '2013-09-29',
    };

    async function show(series: object) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad', ...series });
      await opened.harness.fixture.whenStable();
      return opened.root;
    }

    const items = (root: HTMLElement) =>
      [...root.querySelectorAll('.md-meta > *')].map((item) => item.textContent?.trim());

    it('should show the year, the counts, the genres and the status as distinct items in order', async () => {
      expect(items(await show(FULL))).toEqual([
        '2008',
        '5 saisons · 62 épisodes',
        'Drame, Crime',
        'Terminée',
      ]);
    });

    it('should show the counts in the singular for 1', async () => {
      const root = await show({ numberOfSeasons: 1, numberOfEpisodes: 1 });

      expect(items(root)).toEqual(['1 saison · 1 épisode']);
    });

    it('should show only the season count when the episode count is absent', async () => {
      expect(items(await show({ numberOfSeasons: 5 }))).toEqual(['5 saisons']);
    });

    it('should show only the episode count when the season count is absent', async () => {
      expect(items(await show({ numberOfEpisodes: 62 }))).toEqual(['62 épisodes']);
    });

    it('should leave out the genres when there is none', async () => {
      const root = await show({ ...FULL, genres: [] });

      expect(items(root)).toEqual(['2008', '5 saisons · 62 épisodes', 'Terminée']);
    });

    it('should leave out the year when the first air date is absent', async () => {
      const root = await show({ ...FULL, firstAirDate: undefined });

      expect(items(root)).toEqual(['5 saisons · 62 épisodes', 'Drame, Crime', 'Terminée']);
    });

    it.each([{}, { status: 'UNKNOWN' }, { status: 'toString' }])(
      'should leave out the status %j',
      async (series) => {
        const root = await show({ ...FULL, status: undefined, ...series });

        expect(root.querySelector('app-show-status')).toBeNull();
        expect(items(root)).toEqual(['2008', '5 saisons · 62 épisodes', 'Drame, Crime']);
      },
    );

    it('should render no meta line when every item is absent', async () => {
      expect((await show({})).querySelector('.md-meta')).toBeNull();
    });

    it('should not show the watched progress in the header', async () => {
      const root = await show({
        ...FULL,
        watchlistStatus: 'WATCHING',
        watchedEpisodes: 3,
        totalEpisodes: 62,
      });

      expect(root.querySelector('.md-info')?.textContent).not.toContain('vus');
    });

    it('should show neither a rating, nor the airing block, nor the genre tags', async () => {
      const root = await show(FULL);

      for (const removed of ['.md-airing', '.md-period', '.md-genres', '.md-rating']) {
        expect(root.querySelector(removed)).toBeNull();
      }
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

    it('should show the RETURNING status as « En cours de diffusion »', async () => {
      expect(tag(await airing({ status: 'RETURNING' }))).toBe('En cours de diffusion');
    });

    it.each([
      ['IN_PRODUCTION', 'En production'],
      ['PLANNED', 'Prévue'],
      ['PILOT', 'Pilote'],
      ['ENDED', 'Terminée'],
      ['CANCELED', 'Annulée'],
    ])('should show the %s status as « %s »', async (status, label) => {
      expect(tag(await airing({ status }))).toBe(label);
    });

    it.each([
      ['RETURNING', 'zb-tag-live'],
      ['IN_PRODUCTION', 'zb-tag-soon'],
      ['PLANNED', 'zb-tag-soon'],
      ['PILOT', 'zb-tag-soon'],
      ['ENDED', 'zb-tag-ended'],
      ['CANCELED', 'zb-tag-canceled'],
    ])('should mark the %s status with the dot of the %s tone', async (status, tone) => {
      const root = await airing({ status });

      const dot = root.querySelector('app-show-status .zb-tag.' + tone + ' .zb-tag-dot');
      expect(dot?.getAttribute('aria-hidden')).toBe('true');
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

    it.each([[[]], [undefined]])('should hide the cast section when cast is %j', async (cast) => {
      const root = await show({ cast });

      expect(root.querySelector('.md-cast')).toBeNull();
    });

    it('should show the photo of a member, the placeholder when there is none', async () => {
      const root = await show({
        cast: [
          {
            name: 'Bryan Cranston',
            character: 'Walter White',
            photoUrl: 'https://image.tmdb.org/t/p/w185/bc.jpg',
          },
          { name: 'Aaron Paul', character: 'Jesse Pinkman' },
        ],
      });

      const [withPhoto, withoutPhoto] = [...root.querySelectorAll('.md-cast app-cast-card')];
      expect(withPhoto.querySelector('img')?.getAttribute('src')).toBe(
        'https://image.tmdb.org/t/p/w185/bc.jpg',
      );
      expect(withoutPhoto.querySelector('img')).toBeNull();
      expect(withoutPhoto.querySelector('.zb-cast-photo')?.textContent?.trim()).toBe('AP');
    });
  });

  describe('watchlist', () => {
    async function showWithStatus(watchlistStatus?: string) {
      const opened = await open();
      opened.http
        .expectOne('/series/1396')
        .flush({ id: 1396, name: 'Breaking Bad', watchlistStatus });
      await opened.harness.fixture.whenStable();
      return opened;
    }

    const badge = (root: HTMLElement) => root.querySelector('.md-info .zb-badge');
    const addButton = (root: HTMLElement) =>
      root.querySelector<HTMLButtonElement>('.md-info app-status-button button');

    it.each([
      ['TO_WATCH', 'Watchlist', 'zb-badge-watchlist'],
      ['WATCHED', 'Vu', 'zb-badge-seen'],
      ['WATCHING', 'En cours', 'zb-badge-progress'],
      ['DROPPED', 'Abandonné', 'zb-badge-dropped'],
    ])('should show the %s badge and no add button', async (status, label, css) => {
      const { root } = await showWithStatus(status);

      expect(badge(root)?.textContent?.trim()).toBe(label);
      expect(badge(root)?.classList).toContain(css);
      expect(addButton(root)).toBeNull();
    });

    it('should show no badge and the add button when the status is absent', async () => {
      const { root } = await showWithStatus();

      expect(badge(root)).toBeNull();
      expect(addButton(root)).not.toBeNull();
      expect(root.querySelector('.md-info app-status-button .zb-btn-watchlist')).not.toBeNull();
    });

    describe('adding', () => {
      const SUCCESS = 'Ajouté à ta watchlist.';
      const FAILURE = "L'ajout a échoué. Réessaie dans un instant.";

      async function click() {
        const shown = await showWithStatus();
        addButton(shown.root)?.click();
        await shown.harness.fixture.whenStable();
        return shown;
      }

      it('should post once, then show the Watchlist badge and a success toast', async () => {
        const { harness, http, root } = await click();
        addButton(root)?.click();

        const requests = http.match('/watchlist/series');
        expect(requests).toHaveLength(1);
        expect(requests[0].request.body).toEqual({ tmdbId: 1396 });
        requests[0].flush(null);
        await harness.fixture.whenStable();

        expect(badge(root)?.textContent?.trim()).toBe('Watchlist');
        expect(addButton(root)).toBeNull();
        expect(TestBed.inject(ToastService).message()).toBe(SUCCESS);
      });

      it('should treat a 409 as a success', async () => {
        const { harness, http, root } = await click();

        http.expectOne('/watchlist/series').flush(null, { status: 409, statusText: 'Conflict' });
        await harness.fixture.whenStable();

        expect(badge(root)?.textContent?.trim()).toBe('Watchlist');
        expect(addButton(root)).toBeNull();
        expect(TestBed.inject(ToastService).message()).toBe(SUCCESS);
      });

      it('should toast the failure and keep the add button on another error', async () => {
        const { harness, http, root } = await click();

        http.expectOne('/watchlist/series').flush(null, { status: 500, statusText: 'Error' });
        await harness.fixture.whenStable();

        expect(TestBed.inject(ToastService).message()).toBe(FAILURE);
        expect(badge(root)).toBeNull();
        expect(addButton(root)).not.toBeNull();
      });
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

  describe('seasons', () => {
    async function showSeasons(seasons?: object[]) {
      const opened = await open();
      opened.http.expectOne('/series/1396').flush({ id: 1396, name: 'Breaking Bad', seasons });
      await opened.harness.fixture.whenStable();
      return opened.root;
    }

    it('should show the Saisons section after the hero with a season per entry', async () => {
      const root = await showSeasons([
        { seasonNumber: 2, name: 'Saison 2', episodeCount: 13 },
        { seasonNumber: 1, name: 'Saison 1', episodeCount: 7 },
      ]);

      expect(root.querySelector('.md-hero ~ app-series-seasons h2')?.textContent).toBe('Saisons');
      expect(
        [...root.querySelectorAll('app-season .zb-season-title')].map((el) => el.textContent),
      ).toEqual(['Saison 1', 'Saison 2']);
    });

    it.each([[undefined], [[]]])(
      'should not render the section for seasons %j',
      async (seasons) => {
        const root = await showSeasons(seasons);

        expect(root.querySelector('.md-seasons')).toBeNull();
        expect(root.textContent).not.toContain('Saisons');
      },
    );

    describe('episode checkboxes', () => {
      async function showEpisodes(watchlistStatus?: string) {
        const opened = await open();
        opened.http.expectOne('/series/1396').flush({
          id: 1396,
          name: 'Breaking Bad',
          watchlistStatus,
          seasons: [{ seasonNumber: 1, name: 'Saison 1' }],
        });
        await opened.harness.fixture.whenStable();
        opened.http.expectOne('/series/1396/seasons/1').flush({
          seasonNumber: 1,
          episodes: [{ episodeNumber: 1, name: 'Pilote', watched: true, airDate: '2008-01-20' }],
        });
        await opened.harness.fixture.whenStable();
        return opened;
      }

      const checkbox = (root: HTMLElement) =>
        root.querySelector('app-episode-row [role="checkbox"]');

      it('should show the checkboxes of a series in the watchlist', async () => {
        const { root } = await showEpisodes('WATCHING');

        expect(checkbox(root)?.getAttribute('aria-checked')).toBe('true');
      });

      it('should show no checkbox, nor call, for a series out of the watchlist', async () => {
        const { root, http } = await showEpisodes();

        expect(checkbox(root)).toBeNull();
        http.verify();
      });

      it('should show the checkboxes once the series is added, without reload', async () => {
        const { harness, http, root } = await showEpisodes();

        root.querySelector<HTMLButtonElement>('.md-info app-status-button button')?.click();
        await harness.fixture.whenStable();
        http.expectOne('/watchlist/series').flush(null);
        await harness.fixture.whenStable();

        expect(checkbox(root)).not.toBeNull();
        http.verify();
      });
    });
  });
});
