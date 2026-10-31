import { provideHttpClient } from '@angular/common/http';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TOKEN_STORAGE } from '../../core/auth/auth.service';
import { NotFound } from './not-found';

@Component({ template: '' })
class Page {}

const expiredJwt = (): string => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }));
  return `header.${payload}.signature`;
};

describe('NotFound with an expired stored token', () => {
  it('renders and links back to /', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([
          { path: '', component: Page },
          { path: '**', component: NotFound },
        ]),
        {
          provide: TOKEN_STORAGE,
          useValue: {
            getItem: () => expiredJwt(),
            setItem: () => undefined,
            removeItem: () => undefined,
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inconnue');

    const root = harness.routeNativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toBe('Cette séance n’existe pas.');
    expect(root.querySelector('main a.zb-button-primary')?.getAttribute('href')).toBe('/');
  });
});
