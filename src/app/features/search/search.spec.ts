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
import { Search } from './search';

const USER = { firstName: 'Camille', lastName: 'Durand', email: 'camille.durand@exemple.fr' };

const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

describe('Search', () => {
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

  async function open() {
    const rendered = await render();
    const page = await rendered.harness.navigateByUrl('/recherche', Search);
    rendered.http.expectOne('/users/me').flush(USER);
    await rendered.harness.fixture.whenStable();
    return { ...rendered, page, root: rendered.harness.routeNativeElement as HTMLElement };
  }

  describe('opening the page', () => {
    it('should invite to type, without calling search', async () => {
      const { root, http } = await open();

      expect(root.querySelector('.zb-empty')?.textContent).toContain('2 caractères');
      expect(http.match((req) => req.url === '/search')).toHaveLength(0);
    });

    it('should mark Recherche as the current header link, not Accueil', async () => {
      const { root } = await open();

      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('header nav a'));
      const byLabel = (label: string) => links.find((link) => link.textContent?.trim() === label);
      expect(byLabel('Recherche')?.getAttribute('aria-current')).toBe('page');
      expect(byLabel('Accueil')?.hasAttribute('aria-current')).toBe(false);
    });

    it('should show the signed in user in the header', async () => {
      const { root } = await open();

      expect(root.querySelector('header button[aria-haspopup]')?.textContent).toContain(
        'Camille Durand',
      );
    });

    it('should redirect a visitor who is not signed in to the login with the return url', async () => {
      const { harness, router } = await render(false);

      await harness.navigateByUrl('/recherche');

      expect(router.url).toBe('/connexion?returnUrl=%2Frecherche');
    });
  });
});
