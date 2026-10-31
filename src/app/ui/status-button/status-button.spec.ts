import { TestBed } from '@angular/core/testing';
import { StatusButton } from './status-button';

describe('StatusButton', () => {
  async function render(kind: 'watchlist' | 'seen', active = false, size?: 'sm') {
    const fixture = TestBed.createComponent(StatusButton);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('active', active);
    if (size) fixture.componentRef.setInput('size', size);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button, label: () => button.textContent?.trim() };
  }

  it.each([
    ['watchlist', 'Watchlist'],
    ['seen', 'Marquer vu'],
  ] as const)('should show an inactive %s button as unpressed', async (kind, text) => {
    const { button, label } = await render(kind);

    expect(button.type).toBe('button');
    expect(button.classList).toContain('zb-btn');
    expect(button.classList).toContain(`zb-btn-${kind}`);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(label()).toBe(text);
  });

  it('should show an active seen button as pressed with the word Vu', async () => {
    const { button, label } = await render('seen', true);

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(label()).toBe('Vu');
  });

  it('should keep the word Watchlist when active', async () => {
    const { button, label } = await render('watchlist', true);

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(label()).toBe('Watchlist');
  });

  it('should draw a plus when an inactive watchlist button, its own icon otherwise', async () => {
    const inactive = await render('watchlist');
    const active = await render('watchlist', true);
    const seen = await render('seen');

    const path = (button: HTMLElement) => button.querySelector('svg path')?.getAttribute('d');

    expect(path(inactive.button)).toBe('M12 5v14M5 12h14');
    expect(path(active.button)).toBe('M6 3h12v18l-6-4-6 4z');
    expect(path(seen.button)).toBe('M5 12.5l4.5 4.5L19 7.5');
  });

  it('should toggle the pressed state on each click', async () => {
    const { fixture, button } = await render('watchlist');

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.active()).toBe(true);

    button.click();
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('should apply the small size', async () => {
    const { button } = await render('seen', false, 'sm');

    expect(button.classList).toContain('zb-btn-sm');
  });
});
