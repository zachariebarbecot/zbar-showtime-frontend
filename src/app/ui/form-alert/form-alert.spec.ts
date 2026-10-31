import { TestBed } from '@angular/core/testing';
import { FormAlert } from './form-alert';

describe('FormAlert', () => {
  it('should announce its message with role alert', async () => {
    const fixture = TestBed.createComponent(FormAlert);
    fixture.componentRef.setInput('message', '2 champs sont à corriger.');
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('2 champs sont à corriger.');
  });
});
