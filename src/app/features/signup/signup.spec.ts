import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { Signup } from './signup';

@Component({ template: '' })
class Page {}

describe('Signup', () => {
  const storage = { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 31, 23, 30));
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'inscription', component: Signup },
          { path: 'connexion', component: Page },
        ]),
        { provide: TOKEN_STORAGE, useValue: storage },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inscription', Signup);
    const root = harness.routeNativeElement as HTMLElement;
    document.body.append(root);
    const input = (name: string) =>
      root.querySelector<HTMLInputElement>(`input[name="${name}"]`) as HTMLInputElement;
    const chips = () => Array.from(root.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const type = async (name: string, value: string) => {
      input(name).value = value;
      input(name).dispatchEvent(new Event('input'));
      await harness.fixture.whenStable();
    };
    const blur = async (name: string) => {
      input(name).dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();
    };
    const chooseGender = async (index: number) => {
      chips()[index].click();
      await harness.fixture.whenStable();
    };
    const leaveGender = async () => {
      chips()[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      await harness.fixture.whenStable();
    };
    const submit = async () => {
      root.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await harness.fixture.whenStable();
    };
    const http = TestBed.inject(HttpTestingController);
    return { harness, root, input, chips, type, blur, chooseGender, leaveGender, submit, http };
  }

  describe('page content', () => {
    it('should show the title and the required notice once', async () => {
      const { root } = await render();

      expect(root.querySelector('h1')?.textContent).toContain('Créer un compte');
      const notice = 'Tous les champs sont obligatoires.';
      expect(root.textContent?.split(notice)).toHaveLength(2);
    });

    it('should show the fields in order', async () => {
      const { root } = await render();

      const labels = Array.from(root.querySelectorAll('.zb-field-label')).map((label) =>
        label.textContent?.trim(),
      );
      expect(labels).toEqual([
        'Prénom',
        'Nom',
        'Date de naissance',
        'Genre',
        'Email',
        'Mot de passe',
        'Confirme le mot de passe',
      ]);
    });

    it('should type and complete the text fields for the browser', async () => {
      const { input } = await render();

      expect(input('firstName').autocomplete).toBe('given-name');
      expect(input('lastName').autocomplete).toBe('family-name');
      expect(input('email').type).toBe('email');
      expect(input('email').autocomplete).toBe('email');
      expect(input('password').type).toBe('password');
      expect(input('password').autocomplete).toBe('new-password');
      expect(input('confirmation').type).toBe('password');
      expect(input('confirmation').autocomplete).toBe('new-password');
    });

    it('should limit the date picker from 1900-01-01 to yesterday in local time', async () => {
      const { input } = await render();

      expect(input('birthDate').type).toBe('date');
      expect(input('birthDate').autocomplete).toBe('bday');
      expect(input('birthDate').min).toBe('1900-01-01');
      expect(input('birthDate').max).toBe('2026-10-30');
    });

    it('should offer Homme and Femme as a radiogroup with no choice made', async () => {
      const { root, chips } = await render();

      expect(root.querySelector('[role="radiogroup"]')).not.toBeNull();
      expect(chips().map((chip) => chip.textContent?.trim())).toEqual(['Homme', 'Femme']);
      expect(chips().map((chip) => chip.getAttribute('aria-checked'))).toEqual(['false', 'false']);
    });

    it('should show the password rules linked to the password field', async () => {
      const { root, input } = await render();

      const rules = root.querySelector('app-password-rules ul') as HTMLElement;
      expect(rules).not.toBeNull();
      expect(input('password').getAttribute('aria-describedby')).toBe(rules.id);
    });

    it('should show the primary submit button and the sign-in link', async () => {
      const { root } = await render();

      const submit = root.querySelector<HTMLButtonElement>('button[type="submit"]');
      expect(submit?.textContent).toContain('Créer un compte');
      expect(submit?.classList).toContain('zb-button-primary');
      expect(submit?.classList).toContain('zb-button-lg');
      expect(submit?.classList).toContain('zb-button-block');
      expect(root.textContent).toContain('Déjà un compte ?');
      expect(root.querySelector('a[href="/connexion"]')?.textContent).toContain('Se connecter');
    });

    it('should show the logo and the slogan', async () => {
      const { root } = await render();

      expect(root.querySelector('app-logo')).not.toBeNull();
      expect(root.textContent).toContain('Ce que tu veux voir,');
      expect(root.textContent).toContain('ce que tu as vu.');
    });
  });
});
