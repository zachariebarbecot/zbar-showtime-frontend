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

  describe('dismissal', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const text = (element: HTMLElement) => element.querySelector('[role="status"]')?.textContent;

    it('disappears after about 5 seconds', async () => {
      const { fixture, toasts, element } = setup();
      toasts.show('Échec.');
      await vi.advanceTimersByTimeAsync(4900);
      fixture.detectChanges();

      expect(text(element)).toContain('Échec.');

      await vi.advanceTimersByTimeAsync(200);
      fixture.detectChanges();

      expect(text(element)?.trim()).toBe('');
    });

    it('disappears when the user clicks the Fermer button', async () => {
      const { fixture, toasts, element } = setup();
      toasts.show('Échec.');
      fixture.detectChanges();

      element.querySelector<HTMLButtonElement>('button[aria-label="Fermer"]')?.click();
      fixture.detectChanges();

      expect(text(element)?.trim()).toBe('');
    });
  });
});
