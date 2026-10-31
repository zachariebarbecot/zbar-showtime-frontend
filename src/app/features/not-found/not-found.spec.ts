import { provideHttpClient } from '@angular/common/http';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, TOKEN_STORAGE } from '../../core/auth/auth.service';
import { NotFound } from './not-found';

@Component({ template: '' })
class Page {}

describe('NotFound', () => {
  const setup = async (authenticated: boolean): Promise<HTMLElement> => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([
          { path: '', component: Page },
          { path: 'accueil', component: Page },
          { path: '**', component: NotFound },
        ]),
        {
          provide: TOKEN_STORAGE,
          useValue: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
        },
      ],
    });
    vi.spyOn(TestBed.inject(AuthService), 'isAuthenticated').mockReturnValue(authenticated);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inconnue');
    return harness.routeNativeElement as HTMLElement;
  };

  it.each([true, false])(
    'shows the logo only, the heading and hides the decor (authenticated: %s)',
    async (authenticated) => {
      const root = await setup(authenticated);

      expect(root.querySelector('header [role="img"]')?.getAttribute('aria-label')).toBe(
        'Zbar Showtime',
      );
      expect(root.querySelectorAll('header button').length).toBe(0);
      expect(root.querySelector('h1')?.textContent).toBe('Cette séance n’existe pas.');
      expect(root.querySelector('.nf-code')?.getAttribute('aria-hidden')).toBe('true');
      expect(root.querySelector('.nf-code')?.textContent).toBe('404');
      expect(root.querySelector('.nf-bulbs')?.getAttribute('aria-hidden')).toBe('true');
    },
  );

  it('removes the noindex tag when the page is left', async () => {
    await setup(false);

    TestBed.resetTestingModule();

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('asks search engines not to index the page', async () => {
    await setup(false);

    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex');
  });

  it('links a visitor back to /', async () => {
    const root = await setup(false);

    expect(root.querySelector('main a.zb-button-primary')?.getAttribute('href')).toBe('/');
  });

  it('links a signed-in user back to /accueil', async () => {
    const root = await setup(true);

    expect(root.querySelector('main a.zb-button-primary')?.textContent).toContain(
      'Retour à l’accueil',
    );
    expect(root.querySelector('main a.zb-button-primary')?.getAttribute('href')).toBe('/accueil');
  });

  it('offers neither the search link nor the removed-title message', async () => {
    const root = await setup(true);

    expect(root.textContent).not.toContain('Chercher un titre');
    expect(root.textContent).not.toContain('Ce titre n’est plus à l’affiche.');
  });
});
