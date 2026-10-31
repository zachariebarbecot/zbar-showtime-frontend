import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string): string => readFileSync(join(process.cwd(), path), 'utf8');

describe('tokens.css', () => {
  const tokens = read('src/styles/tokens.css');
  const declared = [
    'bg',
    'surface',
    'surface-raised',
    'line',
    'line-strong',
    'ink',
    'ink-muted',
    'marquee',
    'on-marquee',
    'marquee-ink',
    'seen',
    'on-seen',
    'danger',
    'focus-ring',
    'scrim',
    'space-1',
    'space-2',
    'space-3',
    'space-4',
    'space-6',
    'space-8',
    'radius-sm',
    'radius-md',
    'radius-pill',
    'font-display',
    'font-sans',
    'font-mono',
  ];

  it.each(declared)('defines --%s under :root', (name) => {
    expect(tokens).toMatch(new RegExp(String.raw`:root\s*{[^}]*--${name}\s*:`, 's'));
  });

  it('uses dark theme values', () => {
    expect(tokens).toContain('--bg: #0e0d0c');
    expect(tokens).toContain('--ink: #f4efe8');
    expect(tokens).toContain('--focus-ring: var(--marquee)');
  });

  it('has no light theme block', () => {
    expect(tokens).not.toMatch(/light/i);
    expect(tokens.match(/:root/g)).toHaveLength(1);
  });
});
