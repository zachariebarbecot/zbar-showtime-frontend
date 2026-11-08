import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Season } from '../../api/models/season';
import { provideApiConfiguration } from '../../api/api-configuration';
import { SeriesSeasons } from './series-seasons';

describe('SeriesSeasons', () => {
  async function render(seasons?: readonly Season[], watchlisted = false) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(''),
      ],
    });
    const fixture = TestBed.createComponent(SeriesSeasons);
    fixture.componentRef.setInput('tmdbId', 1396);
    fixture.componentRef.setInput('seasons', seasons);
    fixture.componentRef.setInput('watchlisted', watchlisted);
    await fixture.whenStable();
    return {
      fixture,
      root: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  const titles = (root: HTMLElement) =>
    [...root.querySelectorAll('app-season .zb-season-title')].map((el) => el.textContent?.trim());

  const infos = (root: HTMLElement) =>
    [...root.querySelectorAll('app-season .zb-season-info')].map((el) => el.textContent?.trim());

  describe('list', () => {
    it('should render a season per entry with its name and episode count', async () => {
      const { root } = await render([
        { seasonNumber: 1, name: 'Saison 1', episodeCount: 7 },
        { seasonNumber: 2, name: 'Saison 2', episodeCount: 1 },
      ]);

      expect(titles(root)).toEqual(['Saison 1', 'Saison 2']);
      expect(infos(root)).toEqual(['7 épisodes', '1 épisode']);
    });

    it('should sort seasons by number, the season 0 last', async () => {
      const { root } = await render([
        { seasonNumber: 0, episodeCount: 3 },
        { seasonNumber: 2, episodeCount: 8 },
        { seasonNumber: 1, episodeCount: 7 },
      ]);

      expect(infos(root)).toEqual(['7 épisodes', '8 épisodes', '3 épisodes']);
    });
  });

  describe('special episodes', () => {
    it('should title the season 0 « Épisodes spéciaux » instead of its API name', async () => {
      const { root } = await render([
        { seasonNumber: 1, name: 'Saison 1' },
        { seasonNumber: 0, name: 'Specials' },
      ]);

      expect(titles(root)).toEqual(['Saison 1', 'Épisodes spéciaux']);
    });
  });

  describe('initial state', () => {
    const open = (root: HTMLElement) =>
      [...root.querySelectorAll('.zb-season')].map((el) => el.classList.contains('zb-season-open'));

    it('should expand and load only the first season from 1', async () => {
      const { root, http } = await render([
        { seasonNumber: 0, name: 'Specials' },
        { seasonNumber: 2, name: 'Saison 2' },
        { seasonNumber: 1, name: 'Saison 1' },
      ]);

      expect(open(root)).toEqual([true, false, false]);
      expect(http.match('/series/1396/seasons/1')).toHaveLength(1);
      http.expectNone('/series/1396/seasons/2');
      http.expectNone('/series/1396/seasons/0');
    });

    it('should expand and load the season 0 when it is the only one', async () => {
      const { root, http } = await render([{ seasonNumber: 0, name: 'Specials' }]);

      expect(open(root)).toEqual([true]);
      expect(http.match('/series/1396/seasons/0')).toHaveLength(1);
    });
  });

  describe('expanding', () => {
    const SEASONS = [
      { seasonNumber: 1, name: 'Saison 1' },
      { seasonNumber: 2, name: 'Saison 2' },
    ];
    const toggles = (root: HTMLElement) =>
      root.querySelectorAll<HTMLButtonElement>('button.zb-season-toggle');

    it('should load a collapsed season once when the user expands it', async () => {
      const { fixture, root, http } = await render(SEASONS);
      http.expectOne('/series/1396/seasons/1');

      toggles(root)[1].click();
      await fixture.whenStable();

      expect(toggles(root)[1].getAttribute('aria-expanded')).toBe('true');
      expect(http.match('/series/1396/seasons/2')).toHaveLength(1);
    });

    it('should not load a season again on repeated clicks while it loads', async () => {
      const { root, http } = await render(SEASONS);
      http.expectOne('/series/1396/seasons/1');

      for (let click = 0; click < 5; click++) toggles(root)[1].click();

      expect(http.match('/series/1396/seasons/2')).toHaveLength(1);
    });
  });

  describe('collapsing', () => {
    it('should not load a season again when it is collapsed then expanded', async () => {
      const { fixture, root, http } = await render([
        { seasonNumber: 1, name: 'Saison 1' },
        { seasonNumber: 2, name: 'Saison 2' },
      ]);
      const toggle = root.querySelectorAll<HTMLButtonElement>('button.zb-season-toggle')[1];
      toggle.click();
      await fixture.whenStable();
      http.expectOne('/series/1396/seasons/2');

      toggle.click();
      await fixture.whenStable();
      toggle.click();
      await fixture.whenStable();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      http.expectNone('/series/1396/seasons/2');
    });
  });

  describe('episodes', () => {
    const rows = (root: HTMLElement) => [...root.querySelectorAll('app-episode-row .zb-ep')];

    const flushEpisodes = async (episodes: object[]) => {
      const view = await render([{ seasonNumber: 1, name: 'Saison 1' }]);
      view.http.expectOne('/series/1396/seasons/1').flush({ seasonNumber: 1, episodes });
      await view.fixture.whenStable();
      return view.root;
    };

    it('should show a local loading state until the season response is received', async () => {
      const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      expect(root.querySelector('app-season [role="status"]')?.textContent).toContain('Chargement');
      expect(rows(root)).toHaveLength(0);

      http.expectOne('/series/1396/seasons/1').flush({ seasonNumber: 1, episodes: [] });
      await fixture.whenStable();

      expect(root.querySelector('app-season [role="status"]')).toBeNull();
    });

    it('should render an episode row per episode ordered by episode number', async () => {
      const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      http.expectOne('/series/1396/seasons/1').flush({
        seasonNumber: 1,
        episodes: [
          { episodeNumber: 3, name: 'Trois', runtime: 52 },
          { episodeNumber: 1, name: 'Un', runtime: 47 },
          { episodeNumber: 2, name: 'Deux', runtime: 50 },
        ],
      });
      await fixture.whenStable();

      expect(
        rows(root).map((row) => [
          ...[...row.querySelectorAll('.zb-meta')].map((el) => el.textContent?.trim()),
          row.querySelector('.zb-ep-title')?.textContent,
        ]),
      ).toEqual([
        ['S01E01', '47 min', 'Un'],
        ['S01E02', '50 min', 'Deux'],
        ['S01E03', '52 min', 'Trois'],
      ]);
    });

    it('should not render the seen checkbox of the episodes', async () => {
      const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      http.expectOne('/series/1396/seasons/1').flush({
        seasonNumber: 1,
        episodes: [{ episodeNumber: 1, name: 'Un', runtime: 47 }],
      });
      await fixture.whenStable();

      expect(root.querySelector('app-episode-row .zb-ep')).not.toBeNull();
      expect(root.querySelector('app-episode-row button')).toBeNull();
      expect(root.querySelector('app-episode-row [role="checkbox"]')).toBeNull();
    });

    describe('still', () => {
      it('should show the still in w300 with the code laid on it', async () => {
        const root = await flushEpisodes([
          {
            episodeNumber: 3,
            name: 'Trois',
            stillUrl: 'https://image.tmdb.org/t/p/w500/still.jpg',
          },
        ]);

        const thumb = root.querySelector('app-episode-row .zb-ep-thumb');
        expect(thumb?.querySelector('img')?.getAttribute('src')).toBe(
          'https://image.tmdb.org/t/p/w300/still.jpg',
        );
        expect(thumb?.querySelector('.zb-ep-code')?.textContent?.trim()).toBe('S01E03');
        expect(root.querySelector('app-episode-row button')).toBeNull();
      });

      it('should keep an empty thumb with the code for an episode without still when others have one', async () => {
        const root = await flushEpisodes([
          { episodeNumber: 1, name: 'Un', stillUrl: 'https://image.tmdb.org/t/p/w500/a.jpg' },
          { episodeNumber: 2, name: 'Deux' },
        ]);

        const thumbs = [...root.querySelectorAll('app-episode-row .zb-ep-thumb')];
        expect(thumbs).toHaveLength(2);
        expect(thumbs[1].querySelector('img')).toBeNull();
        expect(thumbs[1].querySelector('.zb-ep-code')?.textContent?.trim()).toBe('S01E02');
      });

      it('should keep the compact row when no episode of the season has a still', async () => {
        const root = await flushEpisodes([{ episodeNumber: 1, name: 'Un' }]);

        expect(root.querySelector('app-episode-row .zb-ep')).not.toBeNull();
        expect(root.querySelector('.zb-ep-thumb')).toBeNull();
      });
    });

    describe('details', () => {
      it('should show the overview as TMDB gives it', async () => {
        const root = await flushEpisodes([
          { episodeNumber: 1, name: 'Un', overview: 'Walter  apprend sa maladie.' },
        ]);

        expect(root.querySelector('app-episode-row .zb-ep-overview')?.textContent).toBe(
          'Walter  apprend sa maladie.',
        );
      });

      it('should show the air date in French in the meta line', async () => {
        const root = await flushEpisodes([
          { episodeNumber: 1, name: 'Un', runtime: 47, airDate: '2025-01-17' },
        ]);

        expect(
          [...root.querySelectorAll('app-episode-row .zb-meta')].at(-1)?.textContent?.trim(),
        ).toBe('47 min · 17 janv. 2025');
      });

      it('should show the date alone when the runtime is missing, and nothing without date', async () => {
        const root = await flushEpisodes([
          { episodeNumber: 1, name: 'Un', airDate: '2025-01-17' },
          { episodeNumber: 2, name: 'Deux' },
        ]);

        const metas = [...root.querySelectorAll('app-episode-row .zb-meta')];
        expect(metas.map((el) => el.textContent?.trim())).toEqual([
          'S01E01',
          '17 janv. 2025',
          'S01E02',
        ]);
      });

      it.each([[undefined], ['']])('should render no overview for %j', async (overview) => {
        const root = await flushEpisodes([{ episodeNumber: 1, name: 'Un', overview }]);

        expect(root.querySelector('app-episode-row .zb-ep-overview')).toBeNull();
      });
    });

    it.each([[{ seasonNumber: 1, episodes: [] }], [{ seasonNumber: 1 }]])(
      'should tell the season has no episode for %j',
      async (response) => {
        const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

        http.expectOne('/series/1396/seasons/1').flush(response);
        await fixture.whenStable();

        expect(root.querySelector('app-season')?.textContent).toContain(
          'Aucun épisode pour cette saison',
        );
        expect(root.querySelector('app-episode-row')).toBeNull();
      },
    );

    it('should not tell the season has no episode when it has some', async () => {
      const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      http.expectOne('/series/1396/seasons/1').flush({
        seasonNumber: 1,
        episodes: [{ episodeNumber: 1, name: 'Un' }],
      });
      await fixture.whenStable();

      expect(root.textContent).not.toContain('Aucun épisode');
    });

    describe('on error', () => {
      const SEASONS = [
        { seasonNumber: 1, name: 'Saison 1' },
        { seasonNumber: 2, name: 'Saison 2' },
      ];
      const retry = (root: HTMLElement) =>
        [...root.querySelectorAll<HTMLButtonElement>('app-season button')].find((button) =>
          button.textContent?.includes('Réessayer'),
        );

      it('should show an error and a retry button in the failed season only', async () => {
        const { fixture, root, http } = await render(SEASONS);

        http
          .expectOne('/series/1396/seasons/1')
          .flush('', { status: 500, statusText: 'Server Error' });
        await fixture.whenStable();

        const [first, second] = root.querySelectorAll('app-season');
        expect(first.querySelector('[role="alert"]')).not.toBeNull();
        expect(first.textContent).toContain('Réessayer');
        expect(second.querySelector('[role="alert"]')).toBeNull();
        expect(second.textContent).not.toContain('Réessayer');
        expect(titles(root)).toEqual(['Saison 1', 'Saison 2']);
      });

      it('should call the season again once when the user retries, then show the episodes', async () => {
        const { fixture, root, http } = await render(SEASONS);
        http
          .expectOne('/series/1396/seasons/1')
          .flush('', { status: 500, statusText: 'Server Error' });
        await fixture.whenStable();

        retry(root)?.click();
        await fixture.whenStable();

        expect(root.querySelector('app-season [role="alert"]')).toBeNull();
        http
          .expectOne('/series/1396/seasons/1')
          .flush({ seasonNumber: 1, episodes: [{ episodeNumber: 1, name: 'Un', runtime: 47 }] });
        await fixture.whenStable();

        expect(root.querySelectorAll('app-episode-row')).toHaveLength(1);
        expect(retry(root)).toBeUndefined();
      });
    });
  });

  describe('watched', () => {
    const SEASONS = [{ seasonNumber: 1, name: 'Saison 1' }];
    const EPISODES = [
      { episodeNumber: 1, name: 'Un', watched: true },
      { episodeNumber: 2, name: 'Deux', watched: false },
      { episodeNumber: 3, name: 'Trois' },
    ];

    async function renderWatchlisted(watchlisted = true) {
      const view = await render(SEASONS, watchlisted);
      view.http.expectOne('/series/1396/seasons/1').flush({ seasonNumber: 1, episodes: EPISODES });
      await view.fixture.whenStable();
      return view;
    }

    const checks = (root: HTMLElement) => [
      ...root.querySelectorAll<HTMLButtonElement>('app-episode-row [role="checkbox"]'),
    ];

    describe('check state', () => {
      it('should check the episodes watched and leave the others unchecked', async () => {
        const { root } = await renderWatchlisted();

        expect(checks(root).map((check) => check.getAttribute('aria-checked'))).toEqual([
          'true',
          'false',
          'false',
        ]);
      });

      it('should show no checkbox when the series is not in the watchlist', async () => {
        const { root } = await renderWatchlisted(false);

        expect(root.querySelectorAll('app-episode-row')).toHaveLength(3);
        expect(checks(root)).toHaveLength(0);
      });

      it('should show the checkboxes once the series joins the watchlist, without reload', async () => {
        const { fixture, root, http } = await renderWatchlisted(false);

        fixture.componentRef.setInput('watchlisted', true);
        await fixture.whenStable();

        expect(checks(root).map((check) => check.getAttribute('aria-checked'))).toEqual([
          'true',
          'false',
          'false',
        ]);
        http.expectNone(() => true);
      });
    });

    describe('marking', () => {
      const EPISODE_2 = '/watchlist/series/1396/seasons/1/episodes/2/watched';

      it('should check the box at once, lock the row and send a POST', async () => {
        const { fixture, root, http } = await renderWatchlisted();

        checks(root)[1].click();
        await fixture.whenStable();

        expect(checks(root)[1].getAttribute('aria-checked')).toBe('true');
        expect(checks(root)[1].disabled).toBe(true);
        expect(checks(root)[0].disabled).toBe(false);
        expect(http.expectOne(EPISODE_2).request.method).toBe('POST');
      });

      it('should unlock the row and keep the box checked once the POST succeeds', async () => {
        const { fixture, root, http } = await renderWatchlisted();
        checks(root)[1].click();
        await fixture.whenStable();

        http.expectOne(EPISODE_2).flush(null, { status: 201, statusText: 'Created' });
        await fixture.whenStable();

        expect(checks(root)[1].getAttribute('aria-checked')).toBe('true');
        expect(checks(root)[1].disabled).toBe(false);
      });
    });
  });

  describe('season poster', () => {
    const poster = (root: HTMLElement) => root.querySelector('.zb-season-head .zb-season-poster');

    it('should show the 2:3 poster in w92 before the title', async () => {
      const { root } = await render([
        {
          seasonNumber: 1,
          name: 'Saison 1',
          posterUrl: 'https://image.tmdb.org/t/p/w500/s1.jpg',
        },
      ]);

      expect(poster(root)?.querySelector('img')?.getAttribute('src')).toBe(
        'https://image.tmdb.org/t/p/w92/s1.jpg',
      );
      expect(
        [...root.querySelectorAll('.zb-season-poster, .zb-season-title')].map((el) => el.className),
      ).toEqual(['zb-season-poster', 'zb-season-title']);
    });

    it('should show the empty surface-raised block when the season has no poster', async () => {
      const { root } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      expect(poster(root)).not.toBeNull();
      expect(poster(root)?.querySelector('img')).toBeNull();
    });
  });

  describe('season overview', () => {
    const overview = (root: HTMLElement) => root.querySelector('.zb-season-overview');

    it('should show the overview as TMDB gives it, before the episodes', async () => {
      const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

      http.expectOne('/series/1396/seasons/1').flush({
        seasonNumber: 1,
        overview: 'Walter White se lance.',
        episodes: [{ episodeNumber: 1, name: 'Pilote' }],
      });
      await fixture.whenStable();

      expect(overview(root)?.textContent).toBe('Walter White se lance.');
      expect(
        [...root.querySelectorAll('.zb-season-overview, app-episode-row')].map((el) => el.tagName),
      ).toEqual(['P', 'APP-EPISODE-ROW']);
    });

    it.each([[{ seasonNumber: 1, episodes: [] }], [{ seasonNumber: 1, overview: '' }]])(
      'should render no overview when the response has none: %j',
      async (response) => {
        const { fixture, root, http } = await render([{ seasonNumber: 1, name: 'Saison 1' }]);

        http.expectOne('/series/1396/seasons/1').flush(response);
        await fixture.whenStable();

        expect(overview(root)).toBeNull();
      },
    );
  });

  describe('season year', () => {
    it('should show the year of the air date after the episode count', async () => {
      const { root } = await render([
        { seasonNumber: 1, episodeCount: 7, airDate: '2008-01-20' },
        { seasonNumber: 2, airDate: '2009-03-08' },
      ]);

      expect(infos(root)).toEqual(['7 épisodes · 2008', '2009']);
    });
  });

  describe('without seasons', () => {
    it('should render nothing, title included', async () => {
      const { root } = await render([]);

      expect(root.querySelector('h2')).toBeNull();
      expect(root.querySelector('app-season')).toBeNull();
    });
  });
});
