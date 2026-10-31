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

  describe('first name, last name and email validation', () => {
    it.each([
      ['firstName', '', 'Indique ton prénom.'],
      ['firstName', '   ', 'Indique ton prénom.'],
      ['lastName', '', 'Indique ton nom.'],
      ['lastName', '   ', 'Indique ton nom.'],
      ['email', '', 'Indique ton email.'],
      ['email', 'zoe@', "Cet email n'a pas l'air valide."],
      ['email', 'zoe@example', "Cet email n'a pas l'air valide."],
    ])('should show the %s error for "%s" on blur', async (name, value, message) => {
      const { root, type, blur } = await render();

      await type(name, value);
      await blur(name);

      expect(root.textContent).toContain(message);
    });

    it('should show nothing while the first typing is in progress', async () => {
      const { root, type } = await render();

      await type('firstName', 'Z');
      await type('firstName', '');
      await type('email', 'zoe@');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });

    it('should accept valid values on blur', async () => {
      const { root, type, blur } = await render();

      await type('firstName', 'Zoé');
      await blur('firstName');
      await type('lastName', 'Martin');
      await blur('lastName');
      await type('email', 'zoe@example.org');
      await blur('email');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });

    it('should clear the error once the value becomes valid', async () => {
      const { root, type, blur } = await render();
      await blur('firstName');

      await type('firstName', 'Zoé');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });
  });

  describe('birth date and gender validation', () => {
    const invalidDate = 'Indique une date de naissance valide.';

    it.each([
      ['empty', ''],
      ['before 1900-01-01', '1899-12-31'],
      ['today (local)', '2026-10-31'],
      ['in the future', '2026-11-01'],
    ])('should refuse a birth date %s on blur', async (_, value) => {
      const { root, type, blur } = await render();

      await type('birthDate', value);
      await blur('birthDate');

      expect(root.textContent).toContain(invalidDate);
    });

    it.each(['1900-01-01', '2000-02-29', '2026-10-30'])(
      'should accept the birth date %s',
      async (value) => {
        const { root, type, blur } = await render();

        await type('birthDate', value);
        await blur('birthDate');

        expect(root.textContent).not.toContain(invalidDate);
      },
    );

    it('should show nothing while the date is first typed', async () => {
      const { root, type } = await render();

      await type('birthDate', '2026-11-01');

      expect(root.textContent).not.toContain(invalidDate);
    });

    it('should ask for a gender when the group is left without a choice', async () => {
      const { root, leaveGender } = await render();

      await leaveGender();

      expect(root.textContent).toContain('Choisis une option.');
    });

    it('should ask for a gender on submit and clear the error once chosen', async () => {
      const { root, submit, chooseGender } = await render();

      await submit();
      expect(root.textContent).toContain('Choisis une option.');

      await chooseGender(1);
      expect(root.textContent).not.toContain('Choisis une option.');
    });
  });

  describe('password validation', () => {
    const rules = 'Ton mot de passe ne respecte pas encore toutes les règles.';
    const tooLong = 'Ton mot de passe ne doit pas dépasser 64 caractères.';
    const withEmail = 'Ton mot de passe ne doit pas contenir ton email.';
    const mismatch = 'Les deux mots de passe ne correspondent pas.';
    const strong = 'Abcdefghij1!';

    it('should ask for a password when left empty', async () => {
      const { root, blur } = await render();

      await blur('password');

      expect(root.textContent).toContain('Choisis un mot de passe.');
    });

    it.each([
      ['shorter than 12 characters', 'Abcdefghij1'],
      ['without an uppercase letter', 'abcdefghij1!'],
      ['without a lowercase letter', 'ABCDEFGHIJ1!'],
      ['without a digit', 'Abcdefghijk!'],
      ['without a special character', 'Abcdefghijk1'],
    ])('should refuse a password %s', async (_, value) => {
      const { root, type, blur } = await render();

      await type('password', value);
      await blur('password');

      expect(root.textContent).toContain(rules);
    });

    it('should refuse a password longer than 64 characters and accept 64', async () => {
      const { root, type, blur } = await render();

      await type('password', `Aa1!${'x'.repeat(61)}`);
      await blur('password');
      expect(root.textContent).toContain(tooLong);

      await type('password', `Aa1!${'x'.repeat(60)}`);
      expect(root.textContent).not.toContain(tooLong);
    });

    it('should refuse a password containing the email whatever the case', async () => {
      const { root, type, blur } = await render();
      await type('email', 'zoe@example.org');

      await type('password', 'My-ZOE@Example.ORG-1');
      await blur('password');

      expect(root.textContent).toContain(withEmail);
    });

    it('should check the password again when the email changes', async () => {
      const { root, type, blur } = await render();
      await type('email', 'other@example.org');
      await type('password', 'My-zoe@example.org-1');
      await blur('password');
      expect(root.textContent).not.toContain(withEmail);

      await type('email', 'zoe@example.org');

      expect(root.textContent).toContain(withEmail);
    });

    it('should accept a strong password', async () => {
      const { root, type, blur } = await render();
      await type('email', 'zoe@example.org');

      await type('password', strong);
      await blur('password');

      expect(root.querySelector('.zb-field-error')).toBeNull();
    });

    it('should refuse a different confirmation on blur', async () => {
      const { root, type, blur } = await render();
      await type('password', strong);

      await type('confirmation', 'Abcdefghij1?');
      await blur('confirmation');

      expect(root.textContent).toContain(mismatch);
    });

    it('should ask to retype the password when the confirmation is empty', async () => {
      const { root, blur } = await render();

      await blur('confirmation');

      expect(root.textContent).toContain('Retape ton mot de passe.');
    });

    it('should accept a matching confirmation', async () => {
      const { root, type, blur } = await render();
      await type('password', strong);

      await type('confirmation', strong);
      await blur('confirmation');

      expect(root.textContent).not.toContain(mismatch);
    });

    it('should check the confirmation again when the password changes', async () => {
      const { root, type, blur } = await render();
      await type('password', strong);
      await type('confirmation', strong);
      await blur('confirmation');

      await type('password', 'Abcdefghij2!');

      expect(root.textContent).toContain(mismatch);
    });
  });
});
