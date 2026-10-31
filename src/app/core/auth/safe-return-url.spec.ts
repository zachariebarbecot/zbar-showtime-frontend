import { safeReturnUrl } from './safe-return-url';

describe('safeReturnUrl', () => {
  it('keeps an internal path', () => {
    expect(safeReturnUrl('/accueil')).toBe('/accueil');
  });

  it.each([
    ['an absolute url', 'https://x.com'],
    ['a protocol-relative url', '//x.com'],
    ['a javascript url', 'javascript:alert(1)'],
    ['a path with a backslash', '/\\x.com'],
    ['an empty value', ''],
    ['a path without leading slash', 'accueil'],
  ])('falls back to /accueil for %s', (_label, value) => {
    expect(safeReturnUrl(value)).toBe('/accueil');
  });
});
