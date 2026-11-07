import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Season } from '../../api/models/season';
import { provideApiConfiguration } from '../../api/api-configuration';
import { SeriesSeasons } from './series-seasons';

describe('SeriesSeasons', () => {
  async function render(seasons?: readonly Season[]) {
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
  });

  describe('without seasons', () => {
    it('should render nothing, title included', async () => {
      const { root } = await render([]);

      expect(root.querySelector('h2')).toBeNull();
      expect(root.querySelector('app-season')).toBeNull();
    });
  });
});
