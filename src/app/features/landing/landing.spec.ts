import { ApplicationRef } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';
import { query } from '../../testing/query';

describe('Landing', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  describe('hero', () => {
    it('should show only the logo in the header', async () => {
      const page = await render();

      const nav = query(page, 'nav');

      expect(nav.querySelectorAll('app-logo')).toHaveLength(1);
      expect(nav.querySelectorAll('a, button')).toHaveLength(0);
    });

    it('should show the name, the slogan and a tagline', async () => {
      const page = await render();

      const hero = query(page, 'header.lp-hero');

      expect(hero.querySelector('h1')?.textContent).toBe('Zbar Showtime');
      expect(hero.textContent).toContain('Ce que tu veux voir, ce que tu as vu.');
      expect(hero.querySelectorAll('p')).toHaveLength(2);
    });

    it('should offer exactly two large buttons to sign up and to log in', async () => {
      const page = await render();

      const buttons = Array.from(page.querySelectorAll<HTMLAnchorElement>('a.zb-button'));

      expect(buttons.map((b) => b.textContent?.trim())).toEqual([
        'Créer un compte',
        'Se connecter',
      ]);
      expect(buttons.map((b) => b.getAttribute('href'))).toEqual(['/inscription', '/connexion']);
      expect(buttons.map((b) => b.classList.contains('zb-button-primary'))).toEqual([true, false]);
      expect(buttons.map((b) => b.classList.contains('zb-button-secondary'))).toEqual([
        false,
        true,
      ]);
      expect(buttons.every((b) => b.classList.contains('zb-button-lg'))).toBe(true);
    });

    it('should not repeat the button labels elsewhere on the page', async () => {
      const page = await render();

      expect(page.textContent?.split('Créer un compte')).toHaveLength(2);
      expect(page.textContent?.split('Se connecter')).toHaveLength(2);
    });
  });

  it('should show the poster wall next to the hero copy', async () => {
    const page = await render();

    expect(page.querySelector('header.lp-hero app-poster-wall')).not.toBeNull();
  });

  describe('modules', () => {
    const cards = (page: HTMLElement) =>
      Array.from(page.querySelectorAll<HTMLElement>('section.lp-section article.lp-card'));

    it('should present three modules, each with a title and a demo', async () => {
      const page = await render();

      expect(cards(page)).toHaveLength(3);
      cards(page).forEach((card) => {
        expect(card.querySelector('h3')?.textContent?.trim()).toBeTruthy();
        expect(card.querySelector('.lp-demo')).not.toBeNull();
      });
    });

    it('should toggle the watchlist and seen buttons of the first demo', async () => {
      const page = await render();
      const [watchlist, seen] = Array.from(
        cards(page)[0].querySelectorAll<HTMLButtonElement>('button[aria-pressed]'),
      );

      expect([watchlist.textContent?.trim(), seen.textContent?.trim()]).toEqual([
        'Watchlist',
        'Marquer vu',
      ]);
      expect([watchlist, seen].map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'true',
        'false',
      ]);

      watchlist.click();
      seen.click();
      await TestBed.inject(ApplicationRef).whenStable();

      expect([watchlist, seen].map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
      ]);
    });

    it('should toggle the check of an episode of the second demo', async () => {
      const page = await render();
      const checks = Array.from(
        cards(page)[1].querySelectorAll<HTMLButtonElement>('button[role="checkbox"]'),
      );

      expect(checks.map((c) => c.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);

      checks[1].click();
      checks[0].click();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(checks.map((c) => c.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    });

    it('should show the name, character and initials of three cast members', async () => {
      const page = await render();

      const cast = Array.from(cards(page)[2].querySelectorAll('.zb-cast'));

      expect(cast.map((c) => c.querySelector('.zb-cast-name')?.textContent)).toEqual([
        'Adam Scott',
        'Britt Lower',
        'Zach Cherry',
      ]);
      expect(cast.map((c) => c.querySelector('.zb-cast-role')?.textContent)).toEqual([
        'Mark S.',
        'Helly R.',
        'Dylan G.',
      ]);
      expect(cast.map((c) => c.querySelector('.zb-cast-photo')?.textContent?.trim())).toEqual([
        'AS',
        'BL',
        'ZC',
      ]);
    });

    it('should send no request', async () => {
      TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
      await render();

      TestBed.inject(HttpTestingController).verify();
    });
  });

  describe('footer', () => {
    it('should contain the logo and exactly the TMDB attribution', async () => {
      const page = await render();

      const footer = query(page, 'footer');

      expect(footer.querySelectorAll('app-logo')).toHaveLength(1);
      expect(footer.querySelectorAll('p')).toHaveLength(1);
      expect(footer.querySelector('p')?.textContent).toBe(
        'This product uses the TMDB API but is not endorsed or certified by TMDB.',
      );
    });
  });
});
