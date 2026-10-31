import { TestBed } from '@angular/core/testing';
import { PasswordRules } from './password-rules';

describe('PasswordRules', () => {
  async function render(value: string, showErrors = false) {
    const fixture = TestBed.createComponent(PasswordRules);
    fixture.componentRef.setInput('id', 'pw-rules');
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('showErrors', showErrors);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, items: () => Array.from(root.querySelectorAll('li')), root };
  }

  it('should list the five rules with an icon and a text each', async () => {
    const { items, root } = await render('');

    expect(root.querySelector('ul')?.id).toBe('pw-rules');
    expect(items().map((item) => item.querySelector('span')?.textContent)).toEqual([
      expect.stringContaining('12 caractères minimum'),
      expect.stringContaining('Une majuscule'),
      expect.stringContaining('Une minuscule'),
      expect.stringContaining('Un chiffre'),
      expect.stringContaining('Un caractère spécial'),
    ]);
    items().forEach((item) => expect(item.querySelector('svg')).not.toBeNull());
  });

  it('should check the satisfied rules and announce them', async () => {
    const { items } = await render('abc');

    expect(items()[2].classList).toContain('zb-rule-ok');
    expect(items()[2].textContent).toContain('respectée');
    expect(items()[1].classList).toContain('zb-rule-todo');
    expect(items()[1].textContent).toContain('manquante');
  });

  it('should update on every new value', async () => {
    const { fixture, items } = await render('abc');

    fixture.componentRef.setInput('value', 'abcDEF123');
    await fixture.whenStable();

    expect(items()[1].classList).toContain('zb-rule-ok');
    expect(items()[3].classList).toContain('zb-rule-ok');
    expect(items()[0].classList).toContain('zb-rule-todo');
  });

  it('should flag missing rules as errors once showErrors is set', async () => {
    const { items } = await render('abc', true);

    expect(items()[0].classList).toContain('zb-rule-error');
    expect(items()[2].classList).toContain('zb-rule-ok');
  });
});
