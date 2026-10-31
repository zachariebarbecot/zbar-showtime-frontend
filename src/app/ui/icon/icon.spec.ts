import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

@Component({
  imports: [Icon],
  template: `<svg appIcon name="eye"></svg>`,
})
class Host {}

describe('Icon', () => {
  it('should be hidden from assistive technologies and draw its path', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('path')?.getAttribute('d')).toContain('M2 12s3.5-7');
  });
});
