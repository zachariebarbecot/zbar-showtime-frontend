import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <app-button variant="secondary" size="lg" block>Annuler</app-button>
    <app-button href="https://example.org">Dehors</app-button>
    <app-button routerLink="/inscription">Créer un compte</app-button>
    <app-button type="submit" disabled>Envoyer</app-button>
  `,
})
class Host {}

describe('Button', () => {
  async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it.each([
    ['primary', 'md'],
    ['secondary', 'lg'],
    ['ghost', 'sm'],
  ] as const)('should apply variant %s and size %s', async (variant, size) => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('size', size);
    fixture.componentRef.setInput('block', true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.classList).toContain('zb-button');
    expect(button.classList).toContain(`zb-button-${variant}`);
    expect(button.classList).toContain(`zb-button-${size}`);
    expect(button.classList).toContain('zb-button-block');
  });

  it('should render a button with its label and variants when no link is given', async () => {
    const root = await render();

    const button = root.querySelector('button.zb-button-secondary') as HTMLButtonElement;

    expect(button.textContent).toContain('Annuler');
    expect(button.classList).toContain('zb-button-lg');
    expect(button.classList).toContain('zb-button-block');
    expect(button.type).toBe('button');
  });

  it('should render an anchor when href is given', async () => {
    const root = await render();

    const link = root.querySelector('a[href="https://example.org"]');

    expect(link?.textContent).toContain('Dehors');
    expect(link?.classList).toContain('zb-button');
  });

  it('should render an anchor to the route when routerLink is given', async () => {
    const root = await render();

    const link = root.querySelector('a[href="/inscription"]');

    expect(link?.textContent).toContain('Créer un compte');
  });

  it('should pass type and disabled to the button', async () => {
    const root = await render();

    const button = root.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });
});
