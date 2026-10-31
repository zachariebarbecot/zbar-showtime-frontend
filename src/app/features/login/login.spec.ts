import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideApiConfiguration } from '../../api/api-configuration';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { Login } from './login';

@Component({ template: '' })
class Page {}

describe('Login', () => {
  const storage = { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() };

  beforeEach(() => storage.setItem.mockClear());

  async function render(url = '/connexion') {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(''),
        provideRouter([
          { path: 'connexion', component: Login },
          { path: 'inscription', component: Page },
          { path: 'accueil', component: Page },
          { path: 'serie', component: Page },
        ]),
        { provide: TOKEN_STORAGE, useValue: storage },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Login);
    const root = harness.routeNativeElement as HTMLElement;
    const field = (name: string) =>
      root.querySelector<HTMLInputElement>(`input[name="${name}"]`) as HTMLInputElement;
    const type = async (name: string, value: string) => {
      field(name).value = value;
      field(name).dispatchEvent(new Event('input'));
      await harness.fixture.whenStable();
    };
    const blur = async (name: string) => {
      field(name).dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();
    };
    const submit = async () => {
      root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await harness.fixture.whenStable();
    };
    const http = TestBed.inject(HttpTestingController);
    const fillValid = async () => {
      await type('email', 'zoe@example.org');
      await type('password', 'secret');
    };
    return { harness, root, field, type, blur, submit, http, fillValid };
  }

  describe('page content', () => {
    it('should show the logo, the title, the fields, the submit button and the sign-up link', async () => {
      const { root } = await render();

      expect(root.querySelector('app-logo')).not.toBeNull();
      expect(root.querySelector('h1')?.textContent).toContain('Se connecter');
      expect(root.textContent).toContain('Content de te revoir.');
      expect(root.querySelector<HTMLInputElement>('input[name="email"]')?.type).toBe('email');
      expect(root.querySelector<HTMLInputElement>('input[name="email"]')?.autocomplete).toBe(
        'email',
      );
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
      expect(root.querySelector('a[href="/inscription"]')?.textContent).toContain(
        'Créer un compte',
      );
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

  describe('invalid submission', () => {
    it('should show the summary, focus the first invalid field and send nothing', async () => {
      const { root, field, submit, http } = await render();

      await submit();

      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        '2 champs sont à corriger.',
      );
      expect(root.textContent).toContain('Indique ton email.');
      expect(root.textContent).toContain('Indique ton mot de passe.');
      expect(document.activeElement).toBe(field('email'));
      http.expectNone(() => true);
    });

    it('should use the singular and focus the password when only it is invalid', async () => {
      const { root, field, type, submit, http } = await render();
      await type('email', 'zoe@example.org');

      await submit();

      expect(root.querySelector('[role="alert"]')?.textContent).toContain(
        '1 champ est à corriger.',
      );
      expect(document.activeElement).toBe(field('password'));
      http.expectNone(() => true);
    });
  });

  describe('successful login', () => {
    it('should post the credentials, store the token and go to /accueil', async () => {
      const { harness, submit, http, fillValid } = await render();
      await fillValid();

      await submit();
      const request = http.expectOne('/auth/login');
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ email: 'zoe@example.org', password: 'secret' });
      request.flush({ token: 'jwt-token' });
      await harness.fixture.whenStable();

      expect(storage.setItem).toHaveBeenCalledWith('token', 'jwt-token');
      expect(TestBed.inject(Router).url).toBe('/accueil');
    });

    it('should go to the safe returnUrl', async () => {
      const { harness, submit, http, fillValid } = await render('/connexion?returnUrl=%2Fserie');
      await fillValid();

      await submit();
      http.expectOne('/auth/login').flush({ token: 'jwt-token' });
      await harness.fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/serie');
    });

    it('should ignore an unsafe returnUrl', async () => {
      const { harness, submit, http, fillValid } = await render(
        '/connexion?returnUrl=%2F%2Fevil.example',
      );
      await fillValid();

      await submit();
      http.expectOne('/auth/login').flush({ token: 'jwt-token' });
      await harness.fixture.whenStable();

      expect(TestBed.inject(Router).url).toBe('/accueil');
    });

    it('should send a single request on a second click while pending', async () => {
      const { submit, http, fillValid } = await render();
      await fillValid();

      await submit();
      await submit();

      http.expectOne('/auth/login');
    });
  });

  describe('failed login', () => {
    it('should show one incorrect credentials alert on 401 and empty the password', async () => {
      const { harness, root, field, submit, http, fillValid } = await render();
      await fillValid();

      await submit();
      http.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();

      const alerts = root.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].textContent).toContain('Email ou mot de passe incorrect.');
      expect(field('password').value).toBe('');
      expect(field('email').value).toBe('zoe@example.org');
      expect(storage.setItem).not.toHaveBeenCalled();
    });

    it.each([
      ['a server error', { status: 500, statusText: 'Server Error' }],
      ['a network error', { status: 0, statusText: 'Unknown Error' }],
    ])('should show the generic alert on %s', async (_, status) => {
      const { harness, root, submit, http, fillValid } = await render();
      await fillValid();

      await submit();
      http.expectOne('/auth/login').flush(null, status);
      await harness.fixture.whenStable();

      const alerts = root.querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].textContent).toContain('Une erreur est survenue. Réessaie dans un instant.');
    });

    it('should keep the button enabled and allow a new attempt', async () => {
      const { harness, root, submit, http, fillValid } = await render();
      await fillValid();
      await submit();
      http.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();

      expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);

      await submit();
      expect(root.textContent).toContain('Indique ton mot de passe.');
      http.expectNone('/auth/login');
    });

    it('should replace a previous alert when the next attempt succeeds', async () => {
      const { harness, root, type, submit, http, fillValid } = await render();
      await fillValid();
      await submit();
      http.expectOne('/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
      await harness.fixture.whenStable();
      await type('password', 'secret');

      await submit();
      expect(root.querySelector('[role="alert"]')).toBeNull();
      http.expectOne('/auth/login').flush({ token: 'jwt-token' });
    });
  });
});
