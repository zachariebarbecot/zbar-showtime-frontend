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

describe('ui.css', () => {
  const ui = read('src/styles/ui.css');

  it.each(['zb-button', 'zb-field', 'zb-rules', 'zb-logo', 'zb-chip', 'zb-poster', 'zb-sr'])(
    'defines .%s',
    (name) => {
      expect(ui).toContain(`.${name}`);
    },
  );

  it('has no Google Fonts import', () => {
    expect(ui).not.toMatch(/@import|googleapis/);
  });

  it('uses only the 599px and 1023px max-width breakpoints', () => {
    const queries = [...ui.matchAll(/@media\s*([^{]+){/g)].map((m) => m[1].trim());
    expect(queries.length).toBeGreaterThan(0);
    for (const query of queries) {
      expect(query).toMatch(/^\(max-width: (599|1023)px\)$/);
    }
  });
});

describe('global styles and index.html', () => {
  const html = read('src/index.html');
  const global = read('src/styles/global.css');

  it('declares the French language', () => {
    expect(html).toContain('<html lang="fr">');
  });

  it.each([
    '@fontsource/big-shoulders-display/700',
    '@fontsource/big-shoulders-display/800',
    '@fontsource/instrument-sans/400',
    '@fontsource/instrument-sans/600',
    '@fontsource/ibm-plex-mono/500',
  ])('imports %s', (font) => {
    expect(global).toContain(`@import '${font}'`);
  });

  it('imports the design tokens and component styles', () => {
    expect(global).toContain("@import './tokens.css'");
    expect(global).toContain("@import './ui.css'");
  });

  it('uses the Logo mark as favicon', () => {
    expect(html).toContain('href="favicon.svg"');
  });
});

describe('zoneless setup', () => {
  it('provides zoneless change detection in appConfig', () => {
    expect(read('src/app/app.config.ts')).toContain('provideZonelessChangeDetection()');
  });

  it('does not depend on zone.js', () => {
    const { dependencies, devDependencies } = JSON.parse(read('package.json'));
    expect({ ...dependencies, ...devDependencies }).not.toHaveProperty('zone.js');
  });
});
