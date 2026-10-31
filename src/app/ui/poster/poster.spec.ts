import { TestBed } from '@angular/core/testing';
import { Poster, PosterEpisode, PosterProgress, PosterStatus } from './poster';
import { query } from '../../testing/query';

describe('Poster', () => {
  async function render(inputs: {
    title: string;
    src?: string;
    meta?: string;
    status?: PosterStatus;
    next?: PosterEpisode;
    progress?: PosterProgress;
  }): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Poster);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('should show the title once on a raised surface, without image', async () => {
    const poster = await render({ title: 'Past Lives' });

    expect(poster.querySelector('.zb-poster-frame')).not.toBeNull();
    expect(poster.querySelectorAll('.zb-poster-title')).toHaveLength(1);
    expect(poster.querySelector('.zb-poster-title')?.textContent).toBe('Past Lives');
    expect(poster.querySelector('img')).toBeNull();
    expect(poster.querySelector('.zb-poster-badge')).toBeNull();
    expect(poster.querySelector('.zb-poster-progress')).toBeNull();
  });

  it.each([
    ['watchlist', 'Watchlist'],
    ['seen', 'Vu'],
  ] as const)('should show the %s badge with its icon and word', async (status, word) => {
    const poster = await render({ title: 'Past Lives', status });

    const badge = query(poster, '.zb-poster-badge .zb-badge');

    expect(badge.classList).toContain(`zb-badge-${status}`);
    expect(badge.textContent?.trim()).toBe(word);
    expect(badge.querySelector('svg path')?.getAttribute('d')).toBeTruthy();
  });

  it('should show the next episode code and the progress bar of a show', async () => {
    const poster = await render({
      title: 'Severance',
      next: { season: 2, episode: 4 },
      progress: { seen: 12, total: 24 },
    });

    expect(poster.querySelector('.zb-poster-code')?.textContent).toBe('S02E04');
    expect(poster.querySelector('.zb-poster-code')?.getAttribute('aria-label')).toBe(
      'Prochain épisode S02E04',
    );
    const bar = query(poster, '.zb-poster-progress');
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(bar.getAttribute('aria-valuemax')).toBe('24');
    expect(query<HTMLElement>(bar, 'span').style.width).toBe('50%');
  });

  it('should show the in-progress badge when there is progress but no status', async () => {
    const poster = await render({ title: 'Severance', progress: { seen: 1, total: 2 } });

    expect(poster.querySelector('.zb-poster-badge .zb-badge-progress')?.textContent?.trim()).toBe(
      'En cours',
    );
  });

  it('should prefer the status badge over the in-progress badge', async () => {
    const poster = await render({
      title: 'Severance',
      status: 'seen',
      progress: { seen: 1, total: 2 },
    });

    expect(poster.querySelectorAll('.zb-badge')).toHaveLength(1);
    expect(poster.querySelector('.zb-badge-seen')).not.toBeNull();
  });

  it('should draw the image under a scrimmed caption that keeps the title', async () => {
    const poster = await render({ title: 'Dune', src: 'https://img.exemple.fr/dune.jpg' });

    const image = query<HTMLImageElement>(poster, '.zb-poster-frame img');
    expect(image.getAttribute('src')).toBe('https://img.exemple.fr/dune.jpg');
    expect(image.getAttribute('alt')).toBe('');
    expect(poster.querySelector('.zb-poster-caption.zb-poster-caption-scrim')).not.toBeNull();
    expect(poster.querySelector('.zb-poster-title')?.textContent).toBe('Dune');
  });

  it('should show the meta line under the title, with or without image', async () => {
    const withImage = await render({
      title: 'Dune',
      src: 'https://img.exemple.fr/d.jpg',
      meta: 'Film · 2021',
    });
    const withoutImage = await render({ title: 'Dune', meta: 'Film · 2021' });

    expect(withImage.querySelector('.zb-poster-meta')?.textContent).toBe('Film · 2021');
    expect(withoutImage.querySelector('.zb-poster-meta')?.textContent).toBe('Film · 2021');
    expect(withoutImage.querySelector('.zb-poster-caption-scrim')).toBeNull();
  });

  it('should show no meta line without meta', async () => {
    const poster = await render({ title: 'Dune' });

    expect(poster.querySelector('.zb-poster-meta')).toBeNull();
  });
});
