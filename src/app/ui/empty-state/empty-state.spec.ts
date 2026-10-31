import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  async function render(inputs: { title: string; text?: string }): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(EmptyState);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('should show the title and the text', async () => {
    const empty = await render({ title: 'Rien ici', text: 'Essaie autre chose.' });

    expect(empty.querySelector('.zb-empty-title')?.textContent).toBe('Rien ici');
    expect(empty.querySelector('.zb-empty-text')?.textContent).toBe('Essaie autre chose.');
  });

  it('should show no text paragraph without text', async () => {
    const empty = await render({ title: 'Rien ici' });

    expect(empty.querySelector('.zb-empty-title')?.textContent).toBe('Rien ici');
    expect(empty.querySelector('.zb-empty-text')).toBeNull();
  });
});
