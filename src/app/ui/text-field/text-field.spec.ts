import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextField } from './text-field';

@Component({
  imports: [TextField, ReactiveFormsModule],
  template: `
    <app-text-field
      name="email"
      label="Email"
      [type]="type()"
      [error]="error()"
      [autocomplete]="autocomplete()"
      [describedBy]="describedBy()"
      [min]="min()"
      [max]="max()"
      [formControl]="control"
    />
  `,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
  readonly type = signal<'text' | 'email' | 'password' | 'date'>('email');
  readonly error = signal<string | undefined>(undefined);
  readonly autocomplete = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly min = signal<string | undefined>(undefined);
  readonly max = signal<string | undefined>(undefined);
}

describe('TextField', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      input: () => root.querySelector('input') as HTMLInputElement,
      root,
    };
  }

  it('should keep the label visible and linked to the input', async () => {
    const { input, root } = await render();

    const label = root.querySelector('label') as HTMLLabelElement;

    expect(label.textContent).toContain('Email');
    expect(label.htmlFor).toBe(input().id);
    expect(input().id).not.toBe('');
    expect(input().name).toBe('email');
  });

  it('should send the typed value to the control', async () => {
    const { host, input, fixture } = await render();

    input().value = 'zoe@example.org';
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.control.value).toBe('zoe@example.org');
  });

  it('should show the control value in the input', async () => {
    const { host, input, fixture } = await render();

    host.control.setValue('lea@example.org');
    await fixture.whenStable();

    expect(input().value).toBe('lea@example.org');
  });

  it('should empty the input when the control is reset', async () => {
    const { host, input, fixture } = await render();
    host.control.setValue('lea@example.org');
    await fixture.whenStable();

    host.control.reset();
    await fixture.whenStable();

    expect(input().value).toBe('');
  });

  it('should mark the control touched on blur', async () => {
    const { host, input } = await render();

    input().dispatchEvent(new Event('blur'));

    expect(host.control.touched).toBe(true);
  });

  it('should expose the autocomplete hint on the input', async () => {
    const { host, input, fixture } = await render();
    expect(input().hasAttribute('autocomplete')).toBe(false);
    host.autocomplete.set('current-password');
    await fixture.whenStable();
    expect(input().autocomplete).toBe('current-password');
  });

  it('should support the date type', async () => {
    const { host, input, fixture } = await render();

    host.type.set('date');
    await fixture.whenStable();

    expect(input().type).toBe('date');
  });

  it('should describe the invalid input with the error message', async () => {
    const { host, input, fixture, root } = await render();
    expect(input().getAttribute('aria-invalid')).toBe('false');

    host.error.set('Indique ton email.');
    await fixture.whenStable();

    const describedBy = input().getAttribute('aria-describedby') as string;
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector(`#${describedBy}`)?.textContent).toContain('Indique ton email.');
  });
  it('should link the input to the external description, after the error message', async () => {
    const { host, input, fixture } = await render();
    expect(input().hasAttribute('aria-describedby')).toBe(false);

    host.describedBy.set('rules');
    await fixture.whenStable();
    expect(input().getAttribute('aria-describedby')).toBe('rules');

    host.error.set('Indique ton email.');
    await fixture.whenStable();
    expect(input().getAttribute('aria-describedby')).toBe(`${input().id}-msg rules`);
  });

  it('should expose the min and max of a date input', async () => {
    const { host, input, fixture } = await render();
    host.type.set('date');
    expect(input().hasAttribute('min')).toBe(false);
    expect(input().hasAttribute('max')).toBe(false);

    host.min.set('1900-01-01');
    host.max.set('2026-10-30');
    await fixture.whenStable();

    expect(input().min).toBe('1900-01-01');
    expect(input().max).toBe('2026-10-30');
  });

  describe('password type', () => {
    it('should toggle the input type, the accessible name and aria-pressed with the eye', async () => {
      const { host, input, fixture, root } = await render();
      host.type.set('password');
      await fixture.whenStable();
      const eye = () => root.querySelector('button') as HTMLButtonElement;
      expect(input().type).toBe('password');
      expect(eye().getAttribute('aria-label')).toBe('Afficher le mot de passe');
      expect(eye().getAttribute('aria-pressed')).toBe('false');

      eye().click();
      await fixture.whenStable();

      expect(input().type).toBe('text');
      expect(eye().getAttribute('aria-label')).toBe('Masquer le mot de passe');
      expect(eye().getAttribute('aria-pressed')).toBe('true');

      eye().click();
      await fixture.whenStable();

      expect(input().type).toBe('password');
      expect(eye().getAttribute('aria-pressed')).toBe('false');
    });

    it.each(['email', 'date'] as const)('should have no eye for type %s', async (type) => {
      const { host, fixture, root } = await render();

      host.type.set(type);
      await fixture.whenStable();

      expect(root.querySelector('button')).toBeNull();
    });
  });
});
