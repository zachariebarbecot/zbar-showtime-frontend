import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { EMAIL_PATTERN, errorOf, fieldError } from './field-error';

const messages = { required: 'Obligatoire.', pattern: 'Invalide.' };

describe('errorOf', () => {
  it('should show nothing while the control is untouched', () => {
    const control = new FormControl('', Validators.required);

    expect(errorOf(control, messages)).toBeUndefined();
  });

  it('should show the message of the first failed validator once touched', () => {
    const control = new FormControl('', [Validators.required, Validators.pattern(EMAIL_PATTERN)]);
    control.markAsTouched();

    expect(errorOf(control, messages)).toBe('Obligatoire.');
  });

  it('should show nothing for a valid touched control', () => {
    const control = new FormControl('a@b.cd', Validators.pattern(EMAIL_PATTERN));
    control.markAsTouched();

    expect(errorOf(control, messages)).toBeUndefined();
  });
});

describe('fieldError', () => {
  it('should follow the control as it is touched and corrected', () => {
    const control = new FormControl('', Validators.required);
    const error = TestBed.runInInjectionContext(() => fieldError(control, messages));
    expect(error()).toBeUndefined();

    control.markAsTouched();
    expect(error()).toBe('Obligatoire.');

    control.setValue('x');
    expect(error()).toBeUndefined();
  });
});
