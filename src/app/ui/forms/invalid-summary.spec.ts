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

  it('should ignore wrapper elements carrying the field name', () => {
    const root = document.createElement('form');
    root.innerHTML = '<app-text-field name="first"><input name="first"></app-text-field>';
    document.body.append(root);
    focusFirstInvalid(formWith(['first']), root);
    expect(document.activeElement).toBe(root.querySelector('input'));
  });

  it('should skip valid fields', () => {
    const root = domWith('first', 'second');

    focusFirstInvalid(formWith(['second']), root);

    expect(document.activeElement).toBe(root.querySelector('[name="second"]'));
  });

  it('should focus the tabbable chip of an invalid radiogroup in DOM order', () => {
    const root = document.createElement('form');
    root.innerHTML = `
      <input name="first">
      <div role="radiogroup" data-name="second">
        <button type="button" role="radio" tabindex="-1" id="no"></button>
        <button type="button" role="radio" tabindex="0" id="yes"></button>
      </div>
      <input name="third">`;
    document.body.append(root);

    focusFirstInvalid(formWith(['second', 'third']), root);

    expect(document.activeElement).toBe(root.querySelector('#yes'));
  });
});
