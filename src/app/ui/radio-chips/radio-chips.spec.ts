import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RadioChips } from './radio-chips';

@Component({
  imports: [RadioChips, ReactiveFormsModule],
  template: `
    <app-radio-chips
      name="gender"
      label="Genre"
      [options]="options"
      [error]="error()"
      [formControl]="control"
    />
  `,
})
class Host {
  readonly options = [
    { value: 'MALE', label: 'Homme' },
    { value: 'FEMALE', label: 'Femme' },
  ];
  readonly control = new FormControl('', { nonNullable: true });
  readonly error = signal<string | undefined>(undefined);
}

describe('RadioChips', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const group = () => root.querySelector<HTMLElement>('[role="radiogroup"]') as HTMLElement;
    const radios = () => Array.from(root.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const press = async (radio: HTMLElement, key: string) => {
      radio.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await fixture.whenStable();
    };
    const click = async (radio: HTMLElement) => {
      radio.click();
      await fixture.whenStable();
    };
    return { fixture, host: fixture.componentInstance, root, group, radios, press, click };
  }

  afterEach(() => document.body.replaceChildren());

  it('should render a labelled radiogroup with one unchecked chip per option', async () => {
    const { group, radios, root } = await render();

    const label = root.querySelector('.zb-field-label') as HTMLElement;
    expect(label.textContent).toContain('Genre');
    expect(group().getAttribute('aria-labelledby')).toBe(label.id);
    expect(group().dataset['name']).toBe('gender');
    expect(radios().map((radio) => radio.textContent?.trim())).toEqual(['Homme', 'Femme']);
    expect(radios().every((radio) => radio.classList.contains('zb-chip'))).toBe(true);
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'false']);
  });

  it('should make only the first chip reachable by Tab while nothing is checked', async () => {
    const { radios } = await render();

    expect(radios().map((radio) => radio.tabIndex)).toEqual([0, -1]);
  });

  it('should check the clicked chip and send its value to the control', async () => {
    const { host, radios, click } = await render();

    await click(radios()[1]);

    expect(host.control.value).toBe('FEMALE');
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'true']);
    expect(radios().map((radio) => radio.tabIndex)).toEqual([-1, 0]);
  });

  it('should show the control value and clear it on reset', async () => {
    const { host, radios, fixture } = await render();

    host.control.setValue('MALE');
    await fixture.whenStable();
    expect(radios()[0].getAttribute('aria-checked')).toBe('true');

    host.control.reset();
    await fixture.whenStable();
    expect(radios().map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'false']);
    expect(radios()[0].tabIndex).toBe(0);
  });

  it.each([
    ['ArrowRight', 0, 1],
    ['ArrowDown', 0, 1],
    ['ArrowRight', 1, 0],
    ['ArrowLeft', 1, 0],
    ['ArrowUp', 1, 0],
    ['ArrowLeft', 0, 1],
  ])(
    'should move from chip %s with %s to chip %s, check it and focus it',
    async (key, from, to) => {
      const { host, radios, press, fixture } = await render();
      document.body.append(fixture.nativeElement);

      await press(radios()[from], key);

      expect(host.control.value).toBe(['MALE', 'FEMALE'][to]);
      expect(document.activeElement).toBe(radios()[to]);
    },
  );

  it('should ignore other keys', async () => {
    const { host, radios, press } = await render();

    await press(radios()[0], 'a');

    expect(host.control.value).toBe('');
  });

  it('should mark the control touched when the focus leaves the group only', async () => {
    const { host, radios, fixture } = await render();

    radios()[0].dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: radios()[1] }),
    );
    expect(host.control.touched).toBe(false);

    radios()[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await fixture.whenStable();
    expect(host.control.touched).toBe(true);
  });

  it('should describe the invalid group with the error message', async () => {
    const { host, group, root, fixture } = await render();
    expect(group().hasAttribute('aria-describedby')).toBe(false);

    host.error.set('Choisis une option.');
    await fixture.whenStable();

    const describedBy = group().getAttribute('aria-describedby') as string;
    expect(root.querySelector(`#${describedBy}`)?.textContent).toContain('Choisis une option.');
    expect(root.querySelector('.zb-field-invalid')).not.toBeNull();
  });
});
