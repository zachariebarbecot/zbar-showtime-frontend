import { TestBed } from '@angular/core/testing';
import { EpisodeRow } from './episode-row';
import { query } from '../../testing/query';

describe('EpisodeRow', () => {
  async function render(seen = false, runtime: number | null = 51) {
    const fixture = TestBed.createComponent(EpisodeRow);
    fixture.componentRef.setInput('season', 2);
    fixture.componentRef.setInput('episode', 3);
    fixture.componentRef.setInput('title', 'Who Is Alive?');
    fixture.componentRef.setInput('runtime', runtime ?? undefined);
    fixture.componentRef.setInput('seen', seen);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, root, check: query<HTMLButtonElement>(root, 'button') };
  }

  it('should show the code, the title and the runtime', async () => {
    const { root } = await render();

    expect(root.textContent).toContain('S02E03');
    expect(root.querySelector('.zb-ep-title')?.textContent).toBe('Who Is Alive?');
    expect(root.textContent).toContain('51 min');
  });

  it.each([null, 0])('should not show the runtime when it is %s', async (runtime) => {
    const { root } = await render(false, runtime);

    expect(root.textContent).not.toContain('min');
    expect(root.querySelectorAll('.zb-meta')).toHaveLength(1);
  });

  it('should not render the checkbox when the check is hidden', async () => {
    const { fixture, root } = await render();
    fixture.componentRef.setInput('showCheck', false);
    await fixture.whenStable();

    expect(root.querySelector('button')).toBeNull();
    expect(root.querySelector('[role="checkbox"]')).toBeNull();
    expect(root.textContent).toContain('S02E03');
  });

  it('should offer an unchecked checkbox to mark the episode seen', async () => {
    const { root, check } = await render();

    expect(check.getAttribute('role')).toBe('checkbox');
    expect(check.getAttribute('aria-checked')).toBe('false');
    expect(check.getAttribute('aria-label')).toBe('Marquer vu : S02E03');
    expect(root.querySelector('.zb-ep-seen')).toBeNull();
  });

  it('should show a seen episode as checked and muted', async () => {
    const { root, check } = await render(true);

    expect(check.getAttribute('aria-checked')).toBe('true');
    expect(check.getAttribute('aria-label')).toBe('Vu : S02E03');
    expect(root.querySelector('.zb-ep-seen')).not.toBeNull();
  });

  it('should toggle the check on each click', async () => {
    const { fixture, check } = await render();

    check.click();
    await fixture.whenStable();
    expect(check.getAttribute('aria-checked')).toBe('true');
    expect(fixture.componentInstance.seen()).toBe(true);

    check.click();
    await fixture.whenStable();
    expect(check.getAttribute('aria-checked')).toBe('false');
  });
});
