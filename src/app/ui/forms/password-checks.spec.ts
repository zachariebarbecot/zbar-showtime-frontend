import { passwordChecks, PasswordRuleId } from './password-checks';

function satisfied(value: string): PasswordRuleId[] {
  return passwordChecks(value)
    .filter((check) => check.ok)
    .map((check) => check.id);
}

describe('passwordChecks', () => {
  it('should return the five rules in order with their labels', () => {
    expect(passwordChecks('').map(({ id, label }) => [id, label])).toEqual([
      ['length', '12 caractères minimum'],
      ['upper', 'Une majuscule'],
      ['lower', 'Une minuscule'],
      ['digit', 'Un chiffre'],
      ['special', 'Un caractère spécial'],
    ]);
  });

  it('should satisfy no rule on an empty value', () => {
    expect(satisfied('')).toEqual([]);
  });

  it('should satisfy every rule on a strong password', () => {
    expect(satisfied('Abcdefghij1!')).toEqual(['length', 'upper', 'lower', 'digit', 'special']);
  });

  it.each([
    ['abcdefghijk', 'length', false],
    ['abcdefghijkl', 'length', true],
    ['abc', 'upper', false],
    ['aBc', 'upper', true],
    ['ÉTÉ', 'upper', true],
    ['ABC', 'lower', false],
    ['AbC', 'lower', true],
    ['été', 'lower', true],
    ['abc', 'digit', false],
    ['ab3', 'digit', true],
    ['ab c 1', 'special', false],
    ['abc1', 'special', false],
    ['éà', 'special', false],
    ['ab-', 'special', true],
  ] as const)('should evaluate %s on rule %s as %s', (value, id, expected) => {
    expect(satisfied(value).includes(id)).toBe(expected);
  });
});
