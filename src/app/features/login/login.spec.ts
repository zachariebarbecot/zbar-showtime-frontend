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
    const root = harness.routeNativeElement as HTMLElement;
    const field = (name: string) => root.querySelector<HTMLInputElement>(`input[name="${name}"]`) as HTMLInputElement;
    const type = async (name: string, value: string) => {
      field(name).value = value;
      field(name).dispatchEvent(new Event('input'));
      await harness.fixture.whenStable();
    };
    const blur = async (name: string) => {
      field(name).dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();
    };
    return { harness, root, field, type, blur };
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

  describe('field validation', () => {
    it.each([
      ['email', '', 'Indique ton email.'],
      ['email', 'zoe@', "Cet email n'a pas l'air valide."],
      ['email', 'zoe@example', "Cet email n'a pas l'air valide."],
      ['password', '', 'Indique ton mot de passe.'],
    ])('should show the %s error for "%s" on blur', async (name, value, message) => {
      const { root, type, blur } = await render();

      await type(name, value);
      await blur(name);

      expect(root.textContent).toContain(message);
    });

    it('should show nothing while the first typing is in progress', async () => {
      const { root, type } = await render();

      await type('email', 'zoe@');
      await type('password', 'x');
      await type('password', '');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });

    it('should accept a valid email and a password on blur', async () => {
      const { root, type, blur } = await render();

      await type('email', 'zoe@example.org');
      await blur('email');
      await type('password', 'secret');
      await blur('password');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });

    it('should clear the error once the value becomes valid', async () => {
      const { root, type, blur } = await render();
      await blur('email');

      await type('email', 'zoe@example.org');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });
  });
});
