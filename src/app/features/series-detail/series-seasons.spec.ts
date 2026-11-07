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
});
