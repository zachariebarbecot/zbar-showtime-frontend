import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { Login } from './login';

@Component({ template: '' })
class Page {}

describe('Login', () => {
  async function render(url = '/connexion') {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'connexion', component: Login },
          { path: 'inscription', component: Page },
          { path: 'accueil', component: Page },
        ]),
        {
          provide: TOKEN_STORAGE,
          useValue: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Login);
    return { harness, root: harness.routeNativeElement as HTMLElement };
  }

  describe('page content', () => {
    it('should show the logo, the title, the fields, the submit button and the sign-up link', async () => {
      const { root } = await render();

      expect(root.querySelector('app-logo')).not.toBeNull();
      expect(root.querySelector('h1')?.textContent).toContain('Se connecter');
      expect(root.textContent).toContain('Content de te revoir.');
      expect(root.querySelector<HTMLInputElement>('input[name="email"]')?.type).toBe('email');
      expect(root.querySelector<HTMLInputElement>('input[name="email"]')?.autocomplete).toBe('email');
      const password = root.querySelector<HTMLInputElement>('input[name="password"]');
      expect(password?.type).toBe('password');
      expect(password?.autocomplete).toBe('current-password');
      expect(root.querySelector('button[aria-label="Afficher le mot de passe"]')).not.toBeNull();

      const submit = root.querySelector<HTMLButtonElement>('button[type="submit"]');
      expect(submit?.textContent).toContain('Se connecter');
      expect(submit?.classList).toContain('zb-button-primary');
      expect(submit?.classList).toContain('zb-button-lg');
      expect(submit?.classList).toContain('zb-button-block');

      expect(root.textContent).toContain('Pas encore de compte ?');
      expect(root.querySelector('a[href="/inscription"]')?.textContent).toContain('Créer un compte');
    });

    it('should not offer a forgotten password link', async () => {
      const { root } = await render();

      expect(root.textContent).not.toContain('Mot de passe oublié');
    });
  });
});
