import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { Home } from './home';

@Component({ template: '' })
class Page {}

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

describe('Home', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };

  beforeEach(() => {
    store.clear();
    store.set('token', 'token');
  });

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'accueil', component: Home },
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
    return { harness, root, http };
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
});
