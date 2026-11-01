import { TestBed } from '@angular/core/testing';
import { StatusButton } from './status-button';
import { query } from '../../testing/query';

describe('StatusButton', () => {
  async function render(kind: 'watchlist' | 'seen', active = false, size?: 'sm') {
    const fixture = TestBed.createComponent(StatusButton);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('active', active);
    if (size) fixture.componentRef.setInput('size', size);
    await fixture.whenStable();
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button');
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

  it('should name the button with the accessible name given', async () => {
    const { fixture, button } = await render('watchlist');
    expect(button.hasAttribute('aria-label')).toBe(false);

    fixture.componentRef.setInput('ariaLabel', 'Ajouter Dune à la watchlist');
    await fixture.whenStable();

    expect(button.getAttribute('aria-label')).toBe('Ajouter Dune à la watchlist');
  });

  describe('when controlled by its consumer', () => {
    async function renderControlled(inputs: { active?: boolean; locked?: boolean }) {
      const rendered = await render('watchlist', inputs.active);
      rendered.fixture.componentRef.setInput('controlled', true);
      rendered.fixture.componentRef.setInput('locked', inputs.locked ?? false);
      await rendered.fixture.whenStable();
      const added = vi.fn();
      rendered.fixture.componentInstance.add.subscribe(added);
      return { ...rendered, added };
    }

    it('should emit add on click without toggling by itself', async () => {
      const { fixture, button, added } = await renderControlled({});

      button.click();
      await fixture.whenStable();

      expect(added).toHaveBeenCalledTimes(1);
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('aria-disabled')).toBeNull();
    });

    it('should neither emit nor toggle once locked, and say it is not actionable', async () => {
      const { fixture, button, added } = await renderControlled({ active: true, locked: true });

      button.click();
      await fixture.whenStable();

      expect(added).not.toHaveBeenCalled();
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });
  });

  it('should apply the small size', async () => {
    const { button } = await render('seen', false, 'sm');

    expect(button.classList).toContain('zb-btn-sm');
  });
});
