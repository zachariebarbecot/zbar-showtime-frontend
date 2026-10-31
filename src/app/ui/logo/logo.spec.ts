import { TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  it('should show Zbar and Showtime under one accessible name', async () => {
    const fixture = TestBed.createComponent(Logo);
    await fixture.whenStable();

    const logo = fixture.nativeElement.querySelector('[role="img"]') as HTMLElement;

    expect(logo.getAttribute('aria-label')).toBe('Zbar Showtime');
    expect(logo.textContent).toContain('Zbar');
    expect(logo.textContent).toContain('Showtime');
  });

  it('should show the mark only when variant is mark', async () => {
    const fixture = TestBed.createComponent(Logo);
    fixture.componentRef.setInput('variant', 'mark');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Showtime');
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
  });

  it('should be a link when href is given and size lg applies its class', async () => {
    const fixture = TestBed.createComponent(Logo);
    fixture.componentRef.setInput('href', '/accueil');
    fixture.componentRef.setInput('size', 'lg');
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/accueil');
    expect(link.classList).toContain('zb-logo-lg');
  });
});
