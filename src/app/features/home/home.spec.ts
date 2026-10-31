import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from '../../core/auth/auth.guard';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { Home } from './home';

@Component({ template: '' })
class Page {}

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe('Home', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    store.clear();
    store.set('token', validToken);
  });

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'accueil', component: Home, canActivate: [authGuard] },
          { path: 'connexion', component: Page },
          { path: '', component: Page },
        ]),
        { provide: TOKEN_STORAGE, useValue: storage },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/accueil', Home);
    const http = TestBed.inject(HttpTestingController);
    const root = harness.routeNativeElement as HTMLElement;
    return { harness, root, http, router: TestBed.inject(Router) };
  }

  describe('greeting and header', () => {
    it('should call GET /users/me and greet the user once it answers', async () => {
      const { harness, root, http } = await render();

      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();

      expect(root.querySelector('h1')?.textContent).toBe('Salut, Camille.');
    });

    it('should show the logo linking to /accueil, a single current Accueil link and the user name', async () => {
      const { harness, root, http } = await render();

      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();

      const logo = root.querySelector<HTMLAnchorElement>('header a[aria-label="Zbar Showtime"]');
      const nav = Array.from(root.querySelectorAll<HTMLAnchorElement>('header nav a'));
      expect(logo?.getAttribute('href')).toBe('/accueil');
      expect(nav.map((link) => link.textContent?.trim())).toEqual(['Accueil']);
      expect(nav[0].getAttribute('aria-current')).toBe('page');
      expect(root.querySelector('header button[aria-haspopup]')?.textContent).toContain(
        'Camille Durand',
      );
    });

    it('should not show Watchlist, Recherche nor Profil links', async () => {
      const { harness, root, http } = await render();

      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();

      const text = root.textContent ?? '';
      expect(text).not.toContain('Watchlist');
      expect(text).not.toContain('Recherche');
      expect(text).not.toContain('Profil');
    });
  });

  describe('logout', () => {
    it('should drop the token and go to / when Se déconnecter is activated', async () => {
      const { harness, root, http, router } = await render();
      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();

      root.querySelector<HTMLButtonElement>('header button[aria-haspopup]')?.click();
      await harness.fixture.whenStable();
      root.querySelector<HTMLButtonElement>('[role="menuitem"]')?.click();
      await harness.fixture.whenStable();

      expect(store.has('token')).toBe(false);
      expect(router.url).toBe('/');
    });

    it('should redirect a later visit of /accueil to /connexion with the returnUrl', async () => {
      const { harness, root, http, router } = await render();
      http.expectOne('/users/me').flush(USER);
      await harness.fixture.whenStable();
      root.querySelector<HTMLButtonElement>('header button[aria-haspopup]')?.click();
      await harness.fixture.whenStable();
      root.querySelector<HTMLButtonElement>('[role="menuitem"]')?.click();
      await harness.fixture.whenStable();

      await router.navigateByUrl('/accueil');

      expect(router.url).toBe('/connexion?returnUrl=%2Faccueil');
    });
  });

  describe('expired session', () => {
    it('should drop the token and go to /connexion when GET /users/me answers 401', async () => {
      const { harness, http, router } = await render();

      http.expectOne('/users/me').flush(null, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();

      expect(store.has('token')).toBe(false);
      expect(router.url).toBe('/connexion');
    });
  });

  describe('failures other than a rejected session', () => {
    const MESSAGE = 'Une erreur est survenue. Réessaie dans un instant.';

    it.each([
      ['a server error', { status: 500, statusText: 'Server Error' }],
      ['a network error', { status: 0, statusText: 'Unknown Error' }],
    ])('should keep the header and replace the title on %s', async (_label, init) => {
      const { harness, root, http } = await render();

      http.expectOne('/users/me').flush(null, init);
      await harness.fixture.whenStable();

      expect(root.querySelector('header nav a')?.textContent).toContain('Accueil');
      expect(root.querySelector('h1')).toBeNull();
      expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe(MESSAGE);
    });

    it('should still offer Se déconnecter in the header, which drops the token and goes to /', async () => {
      const { harness, root, http, router } = await render();
      http.expectOne('/users/me').flush(null, { status: 500, statusText: 'Server Error' });
      await harness.fixture.whenStable();

      const logout = Array.from(root.querySelectorAll<HTMLButtonElement>('header button')).find(
        (button) => button.textContent?.trim() === 'Se déconnecter',
      );
      logout?.click();
      await harness.fixture.whenStable();

      expect(logout).toBeDefined();
      expect(store.has('token')).toBe(false);
      expect(router.url).toBe('/');
    });

    it('should not show the error alert while the session is rejected', async () => {
      const { harness, root, http } = await render();

      http.expectOne('/users/me').flush(null, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();

      expect(root.querySelector('[role="alert"]')).toBeNull();
    });
  });

  it('should display a first name containing HTML as text', async () => {
    const { harness, root, http } = await render();

    http.expectOne('/users/me').flush({ ...USER, firstName: '<b>Cam</b>' });
    await harness.fixture.whenStable();

    expect(root.querySelector('h1')?.textContent).toBe('Salut, <b>Cam</b>.');
    expect(root.querySelector('h1 b')).toBeNull();
  });
});
