import { FormControl, FormGroup, Validators } from '@angular/forms';
import { focusFirstInvalid, invalidSummary } from './invalid-summary';

function formWith(invalidNames: string[]): FormGroup {
  return new FormGroup(
    Object.fromEntries(
      ['first', 'second', 'third'].map((name) => [
        name,
        new FormControl('', invalidNames.includes(name) ? Validators.required : []),
      ]),
    ),
  );
}

describe('invalidSummary', () => {
  it('should use the singular for one invalid field', () => {
    expect(invalidSummary(formWith(['second']))).toBe('1 champ est à corriger.');
  });

  it('should use the plural for several invalid fields', () => {
    expect(invalidSummary(formWith(['first', 'third']))).toBe('2 champs sont à corriger.');
  });
});

describe('focusFirstInvalid', () => {
  function domWith(...names: string[]): HTMLElement {
    const root = document.createElement('form');
    root.innerHTML = names.map((name) => `<input name="${name}">`).join('');
    document.body.append(root);
    return root;
  }

  afterEach(() => document.body.replaceChildren());

  it('should focus the first invalid field in DOM order, not in control order', () => {
    const root = domWith('third', 'first', 'second');

    focusFirstInvalid(formWith(['first', 'third']), root);

    expect(document.activeElement).toBe(root.querySelector('[name="third"]'));
  });

  it('should skip valid fields', () => {
    const root = domWith('first', 'second');

    focusFirstInvalid(formWith(['second']), root);

    expect(document.activeElement).toBe(root.querySelector('[name="second"]'));
  });
});
