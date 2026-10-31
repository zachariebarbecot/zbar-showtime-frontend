import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
  let fixture: ComponentFixture<UserMenu>;
  let root: HTMLElement;
  let logouts: number;

  beforeEach(async () => {
    logouts = 0;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(UserMenu);
    fixture.componentRef.setInput('firstName', 'Camille');
    fixture.componentRef.setInput('lastName', 'Durand');
    fixture.componentRef.setInput('email', 'camille.durand@exemple.fr');
    fixture.componentInstance.logout.subscribe(() => logouts++);
    document.body.append(fixture.nativeElement);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => root.remove());

  const trigger = () => root.querySelector('button[aria-haspopup]') as HTMLButtonElement;
  const items = () => Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const settle = () => fixture.whenStable();
  const open = async () => {
    trigger().click();
    await settle();
  };

  it('should show the initials, the full name and a closed menu', () => {
    expect(trigger().textContent).toContain('CD');
    expect(trigger().textContent).toContain('Camille Durand');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(items()).toEqual([]);
  });

  it('should open on trigger activation with only a Se déconnecter item and the email', async () => {
    await open();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(items().map((item) => item.textContent?.trim())).toEqual(['Se déconnecter']);
    expect(root.textContent).toContain('camille.durand@exemple.fr');
  });

  it('should move the focus to the first item when it opens', async () => {
    await open();

    expect(document.activeElement).toBe(items()[0]);
  });

  it('should close on Escape and give the focus back to the trigger', async () => {
    await open();

    items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(items()).toEqual([]);
    expect(document.activeElement).toBe(trigger());
  });

  it('should close on a click outside', async () => {
    await open();

    document.body.click();
    await settle();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(items()).toEqual([]);
  });

  it('should stay open on a click inside the menu outside of an item', async () => {
    await open();

    root.querySelector<HTMLElement>('[role="menu"]')?.click();
    await settle();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('should close when the trigger is activated again', async () => {
    await open();
    await open();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('should emit logout when Se déconnecter is activated', async () => {
    await open();

    items()[0].click();

    expect(logouts).toBe(1);
  });
});
