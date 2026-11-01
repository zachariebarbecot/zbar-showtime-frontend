import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastService } from './toast.service';

describe('Toast', () => {
  const setup = () => {
    const fixture = TestBed.createComponent(Toast);
    const toasts = TestBed.inject(ToastService);
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, toasts, element };
  };

  it('keeps an empty polite status region while no toast is shown', async () => {
    const { fixture, element } = setup();
    await fixture.whenStable();

    const region = element.querySelector('[role="status"]');

    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent?.trim()).toBe('');
  });

  it('shows the message inside the status region', async () => {
    const { fixture, toasts, element } = setup();

    toasts.show("L'ajout a échoué.");
    await fixture.whenStable();

    expect(element.querySelector('[role="status"]')?.textContent).toContain("L'ajout a échoué.");
  });
});
