import { readFileSync } from 'node:fs';

describe('ui.css', () => {
  it('should dim the check and show a wait cursor while its request is pending', () => {
    const css = readFileSync('src/styles/ui.css', 'utf8');
    const rule = /\.zb-check:disabled\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

    expect(rule).toMatch(/opacity:\s*0?\.\d+/);
    expect(rule).toMatch(/cursor:\s*wait/);
  });
});
