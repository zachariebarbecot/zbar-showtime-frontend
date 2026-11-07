import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Season } from './season';

@Component({
  imports: [Season],
  template: `
    <app-season title="Saison 1" info="7 épisodes" [(expanded)]="expanded">
      <p class="content">Contenu</p>
    </app-season>
  `,
})
class Host {
  expanded = false;
}

describe('Season', () => {
  async function render(expanded: boolean) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.expanded = expanded;
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const toggle = () => root.querySelector<HTMLButtonElement>('button.zb-season-toggle');
    const body = () => root.querySelector<HTMLElement>('.zb-season-body');
    return { fixture, root, toggle, body };
  }

  it('should show the title and the info in the toggle', async () => {
    const { toggle } = await render(false);

    expect(toggle()?.textContent).toContain('Saison 1');
    expect(toggle()?.textContent).toContain('7 épisodes');
  });

  it('should be a native button, so Enter and Space toggle it from the keyboard', async () => {
    const { toggle } = await render(false);

    expect(toggle()?.tagName).toBe('BUTTON');
    expect(toggle()?.type).toBe('button');
    expect(toggle()?.tabIndex).toBe(0);
  });

  it('should be collapsed with aria-expanded false and a hidden body', async () => {
    const { toggle, body } = await render(false);

    expect(toggle()?.getAttribute('aria-expanded')).toBe('false');
    expect(body()?.hidden).toBe(true);
  });

  it('should be expanded with aria-expanded true and the projected content visible', async () => {
    const { toggle, body } = await render(true);

    expect(toggle()?.getAttribute('aria-expanded')).toBe('true');
    expect(body()?.hidden).toBe(false);
    expect(body()?.querySelector('.content')?.textContent).toBe('Contenu');
  });

  it('should point aria-controls at its body', async () => {
    const { toggle, body } = await render(false);

    expect(body()?.id).toBeTruthy();
    expect(toggle()?.getAttribute('aria-controls')).toBe(body()?.id);
  });

  it('should toggle and report the state on each click', async () => {
    const { fixture, toggle, body } = await render(false);

    toggle()?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.expanded).toBe(true);
    expect(toggle()?.getAttribute('aria-expanded')).toBe('true');
    expect(body()?.hidden).toBe(false);

    toggle()?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.expanded).toBe(false);
    expect(toggle()?.getAttribute('aria-expanded')).toBe('false');
    expect(body()?.hidden).toBe(true);
  });
});
