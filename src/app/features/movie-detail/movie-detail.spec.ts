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

  async function open(id: number | string = 603) {
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

    it('should show only the year when the runtime is absent', async () => {
      const { root } = await show({ ...MATRIX, runtime: undefined });

      expect(text(root, '.md-meta')).toBe('1999');
    });

    it('should show only the runtime when the date is absent', async () => {
      const { root } = await show({ ...MATRIX, releaseDate: undefined });

      expect(text(root, '.md-meta')).toBe('136 min');
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

  describe('not found', () => {
    it.each(['abc', '0', '-3', '1.5'])(
      'should show the not found empty state without calling the API for id %s',
      async (id) => {
        const { harness, http, root } = await open(id);
        await harness.fixture.whenStable();

        http.expectNone((request) => request.url.startsWith('/movies/'));
        expect(root.querySelector('.zb-empty-title')?.textContent).toContain('Film introuvable');
        expect(root.querySelector('[role="status"]')).toBeNull();
      },
    );

    it.each([404, 400])('should show the not found empty state on a %i', async (status) => {
      const { harness, http, root } = await open();
      http.expectOne('/movies/603').flush('', { status, statusText: 'Error' });
      await harness.fixture.whenStable();

      expect(root.querySelector('.zb-empty-title')?.textContent).toContain('Film introuvable');
      expect(root.querySelector('a[href="/recherche"].zb-button')).not.toBeNull();
      expect(root.querySelector('.md-hero')).toBeNull();
    });
  });

  describe('server error', () => {
    it.each([500, 0])('should show an error message and a retry button on a %i', async (status) => {
      const { harness, http, root } = await open();
      http.expectOne('/movies/603').flush('', { status, statusText: 'Error' });
      await harness.fixture.whenStable();

      expect(root.querySelector('[role="alert"]')).not.toBeNull();
      expect(root.querySelector('main button')?.textContent).toContain('Réessayer');
      expect(root.querySelector('.zb-empty-title')).toBeNull();
    });
  });

  describe('retry', () => {
    it('should call the movie endpoint again and show the details on success', async () => {
      const { harness, http, root } = await open();
      http.expectOne('/movies/603').flush('', { status: 500, statusText: 'Error' });
      await harness.fixture.whenStable();

      root.querySelector<HTMLButtonElement>('main button')?.click();
      harness.detectChanges();
      http.expectOne('/movies/603').flush({ id: 603, title: 'Matrix' });
      await harness.fixture.whenStable();

      expect(root.querySelector('h1.md-title')?.textContent?.trim()).toBe('Matrix');
      expect(root.querySelector('[role="alert"]')).toBeNull();
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

  describe('credits', () => {
    async function show(movie: object) {
      const opened = await open();
      opened.http.expectOne('/movies/603').flush({ id: 603, title: 'Matrix', ...movie });
      await opened.harness.fixture.whenStable();
      return opened.root;
    }

    it('should list every director', async () => {
      const root = await show({ directors: ['Lana Wachowski', 'Lilly Wachowski'] });

      expect(root.querySelector('.md-directors h2')?.textContent).toContain('Réalisation');
      expect(
        [...root.querySelectorAll('.md-directors li')].map((li) => li.textContent?.trim()),
      ).toEqual(['Lana Wachowski', 'Lilly Wachowski']);
    });

    it.each([[[]], [undefined]])(
      'should hide the directors section when directors is %j',
      async (directors) => {
        const root = await show({ directors });

        expect(root.querySelector('.md-directors')).toBeNull();
      },
    );

    const CAST = [
      { name: 'Keanu Reeves', character: 'Neo' },
      { name: 'Carrie-Anne Moss', character: 'Trinity' },
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
        ['Keanu Reeves', 'Neo'],
        ['Carrie-Anne Moss', 'Trinity'],
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
            name: 'Keanu Reeves',
            character: 'Neo',
            photoUrl: 'https://image.tmdb.org/t/p/w185/k.jpg',
          },
          { name: 'Carrie-Anne Moss', character: 'Trinity' },
        ],
      });

      const [withPhoto, withoutPhoto] = [...root.querySelectorAll('.md-cast app-cast-card')];
      expect(withPhoto.querySelector('img')?.getAttribute('src')).toBe(
        'https://image.tmdb.org/t/p/w185/k.jpg',
      );
      expect(withoutPhoto.querySelector('img')).toBeNull();
      expect(withoutPhoto.querySelector('.zb-cast-photo')?.textContent?.trim()).toBe('CM');
    });
  });

  describe('watchlist', () => {
    async function showWithStatus(watchlistStatus?: string) {
      const opened = await open();
      opened.http.expectOne('/movies/603').flush({ id: 603, title: 'Matrix', watchlistStatus });
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

        const requests = http.match('/watchlist/movies');
        expect(requests).toHaveLength(1);
        expect(requests[0].request.body).toEqual({ tmdbId: 603 });
        requests[0].flush(null);
        await harness.fixture.whenStable();

        expect(badge(root)?.textContent?.trim()).toBe('Watchlist');
        expect(addButton(root)).toBeNull();
        expect(TestBed.inject(ToastService).message()).toBe(SUCCESS);
      });

      it('should treat a 409 as a success', async () => {
        const { harness, http, root } = await click();

        http.expectOne('/watchlist/movies').flush(null, { status: 409, statusText: 'Conflict' });
        await harness.fixture.whenStable();

        expect(badge(root)?.textContent?.trim()).toBe('Watchlist');
        expect(addButton(root)).toBeNull();
        expect(TestBed.inject(ToastService).message()).toBe(SUCCESS);
      });

      it('should toast the failure and keep the add button on another error', async () => {
        const { harness, http, root } = await click();

        http.expectOne('/watchlist/movies').flush(null, { status: 500, statusText: 'Error' });
        await harness.fixture.whenStable();

        expect(TestBed.inject(ToastService).message()).toBe(FAILURE);
        expect(badge(root)).toBeNull();
        expect(addButton(root)).not.toBeNull();
      });
    });
  });
});
