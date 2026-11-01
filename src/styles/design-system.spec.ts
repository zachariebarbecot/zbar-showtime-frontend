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
    'scrim-fade',
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

  it('fades the poster caption into the image and shows the meta in marquee', () => {
    const rule = (selector: string) =>
      ui.match(
        new RegExp(String.raw`(?:^|\n)${selector.replace(/[.]/g, '\\.')}\s*\{([^}]*)\}`),
      )?.[1] ?? '';
    expect(rule('.zb-poster-caption-scrim')).toContain('background: var(--scrim-fade)');
    expect(rule('.zb-poster-meta')).toContain('color: var(--marquee-ink)');
    expect(rule('.zb-poster-caption-scrim .zb-poster-meta')).toContain('color: var(--marquee)');
  });

  describe('toast', () => {
    const tokens = read('src/styles/tokens.css');
    const toastCss = [...ui.matchAll(/(?:^|\n)(\.zb-toast[^{]*)\{([^}]*)\}/g)]
      .map((m) => m[2])
      .join('\n');

    it('is raised, outlined and shadowed with existing tokens', () => {
      expect(toastCss).toContain('background: var(--surface-raised)');
      expect(toastCss).toContain('border: 1px solid var(--line-strong)');
      expect(toastCss).toContain('color: var(--ink)');
      expect(toastCss).toContain('border-radius: var(--radius-md)');
      expect(toastCss).toContain('box-shadow: var(--shadow-poster)');
    });

    it('uses no literal color and only declared tokens', () => {
      expect(toastCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
      const used = [...toastCss.matchAll(/var\(--([\w-]+)\)/g)].map((m) => m[1]);
      expect(used.length).toBeGreaterThan(0);
      for (const name of used) {
        expect(tokens).toMatch(new RegExp(String.raw`--${name}\s*:`));
      }
    });

    it('sits bottom right, centered on phones', () => {
      expect(toastCss).toContain('position: fixed');
      expect(toastCss).toContain('right: var(--space-8)');
      expect(ui).toMatch(/@media \(max-width: 599px\) \{\s*\.zb-toast \{[^}]*left: 50%/);
    });
  });

  it('renders the dropped badge on a raised surface with readable ink', () => {
    const rule = ui.match(/(?:^|\n)\.zb-badge-dropped\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toContain('background: var(--surface-raised)');
    expect(rule).toContain('color: var(--ink)');
  });

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
