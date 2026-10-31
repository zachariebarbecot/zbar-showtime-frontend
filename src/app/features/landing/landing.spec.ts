import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

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

      const nav = page.querySelector('nav') as HTMLElement;

      expect(nav.querySelectorAll('app-logo')).toHaveLength(1);
      expect(nav.querySelectorAll('a, button')).toHaveLength(0);
    });

    it('should show the name, the slogan and a tagline', async () => {
      const page = await render();

      const hero = page.querySelector('header.lp-hero') as HTMLElement;

      expect(hero.querySelector('h1')?.textContent).toBe('Zbar Showtime');
      expect(hero.textContent).toContain('Ce que tu veux voir, ce que tu as vu.');
      expect(hero.querySelectorAll('p')).toHaveLength(2);
    });

    it('should offer exactly two large buttons to sign up and to log in', async () => {
      const page = await render();

      const buttons = Array.from(page.querySelectorAll<HTMLAnchorElement>('a.zb-button'));

      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Créer un compte', 'Se connecter']);
      expect(buttons.map((b) => b.getAttribute('href'))).toEqual(['/inscription', '/connexion']);
      expect(buttons.map((b) => b.classList.contains('zb-button-primary'))).toEqual([true, false]);
      expect(buttons.map((b) => b.classList.contains('zb-button-secondary'))).toEqual([false, true]);
      expect(buttons.every((b) => b.classList.contains('zb-button-lg'))).toBe(true);
    });

    it('should not repeat the button labels elsewhere on the page', async () => {
      const page = await render();

      expect(page.textContent?.split('Créer un compte')).toHaveLength(2);
      expect(page.textContent?.split('Se connecter')).toHaveLength(2);
    });
  });
});
