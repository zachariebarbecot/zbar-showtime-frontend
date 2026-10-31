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
      [formControl]="control"
    />
  `,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
  readonly type = signal<'text' | 'email' | 'password' | 'date'>('email');
  readonly error = signal<string | undefined>(undefined);
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

  it('should mark the control touched on blur', async () => {
    const { host, input } = await render();

    input().dispatchEvent(new Event('blur'));

    expect(host.control.touched).toBe(true);
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
});
