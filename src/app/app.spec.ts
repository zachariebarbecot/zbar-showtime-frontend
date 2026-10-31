import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TOKEN_STORAGE } from './core/auth/auth.service';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  const setup = async (storedToken: string | null): Promise<RouterTestingHarness> => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        {
          provide: TOKEN_STORAGE,
          useValue: {
            getItem: () => storedToken,
            setItem: () => undefined,
            removeItem: () => undefined,
          },
        },
      ],
    });
    return RouterTestingHarness.create();
  };

  const validToken = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.s`;

  it('renders only the router outlet in the root component', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
  });

  it.each(['/', '/connexion', '/inscription'])('shows %s to a guest', async (url) => {
    const harness = await setup(null);
    await harness.navigateByUrl(url);

    expect(TestBed.inject(Router).url).toBe(url);
  });

  it('sends a guest from /accueil to /connexion', async () => {
    const harness = await setup(null);
    await harness.navigateByUrl('/accueil');

    expect(TestBed.inject(Router).url).toBe('/connexion?returnUrl=%2Faccueil');
  });

  it.each(['/', '/connexion', '/inscription'])(
    'sends a logged user from %s to /accueil',
    async (url) => {
      const harness = await setup(validToken);
      await harness.navigateByUrl(url);

      expect(TestBed.inject(Router).url).toBe('/accueil');
    },
  );

  it('serves a placeholder for unknown urls', async () => {
    const harness = await setup(null);
    await harness.navigateByUrl('/nope');

    expect(TestBed.inject(Router).url).toBe('/nope');
  });

  it('sends the bearer token on API calls', async () => {
    await setup(validToken);

    TestBed.inject(HttpClient).get('/users/me').subscribe();

    expect(
      TestBed.inject(HttpTestingController)
        .expectOne('/users/me')
        .request.headers.get('Authorization'),
    ).toBe(`Bearer ${validToken}`);
  });
});
