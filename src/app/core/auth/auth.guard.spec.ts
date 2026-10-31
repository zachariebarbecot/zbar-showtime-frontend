import { provideHttpClient } from '@angular/common/http';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { AuthService, TOKEN_STORAGE } from './auth.service';
import { guestGuard } from './guest.guard';

@Component({ template: '' })
class Page {}

describe('route guards', () => {
  const setup = (authenticated: boolean): Promise<RouterTestingHarness> => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([
          { path: '', component: Page, canActivate: [guestGuard] },
          { path: 'connexion', component: Page, canActivate: [guestGuard] },
          { path: 'inscription', component: Page, canActivate: [guestGuard] },
          { path: 'accueil', component: Page, canActivate: [authGuard] },
        ]),
        {
          provide: TOKEN_STORAGE,
          useValue: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
        },
      ],
    });
    vi.spyOn(TestBed.inject(AuthService), 'isAuthenticated').mockReturnValue(authenticated);
    return RouterTestingHarness.create();
  };

  it('redirects a guest from /accueil to /connexion with the returnUrl', async () => {
    await (await setup(false)).navigateByUrl('/accueil');

    expect(TestBed.inject(Router).url).toBe('/connexion?returnUrl=%2Faccueil');
  });

  it('lets a logged user open /accueil', async () => {
    await (await setup(true)).navigateByUrl('/accueil');

    expect(TestBed.inject(Router).url).toBe('/accueil');
  });

  it.each(['/', '/connexion', '/inscription'])(
    'redirects a logged user from %s to /accueil',
    async (url) => {
      await (await setup(true)).navigateByUrl(url);

      expect(TestBed.inject(Router).url).toBe('/accueil');
    },
  );

  it.each(['/', '/connexion', '/inscription'])('lets a guest open %s', async (url) => {
    await (await setup(false)).navigateByUrl(url);

    expect(TestBed.inject(Router).url).toBe(url);
  });
});
