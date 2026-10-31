import { TestBed } from '@angular/core/testing';
import { CastCard } from './cast-card';

describe('CastCard', () => {
  async function render(name: string, character: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(CastCard);
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('character', character);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('should show the name, the character and the initials, without photo', async () => {
    const card = await render('Adam Scott', 'Mark S.');

    expect(card.querySelector('.zb-cast-name')?.textContent).toBe('Adam Scott');
    expect(card.querySelector('.zb-cast-role')?.textContent).toBe('Mark S.');
    expect(card.querySelector('.zb-cast-photo')?.textContent?.trim()).toBe('AS');
    expect(card.querySelector('img')).toBeNull();
  });

  it('should keep only two initials of a long name', async () => {
    const card = await render('Jean Claude Van Damme', 'Lui');

    expect(card.querySelector('.zb-cast-photo')?.textContent?.trim()).toBe('JC');
  });
});
