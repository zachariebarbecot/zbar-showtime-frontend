export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'digit' | 'special';

export interface PasswordCheck {
  readonly id: PasswordRuleId;
  readonly label: string;
  readonly ok: boolean;
}

const RULES: readonly { id: PasswordRuleId; label: string; test: (value: string) => boolean }[] = [
  { id: 'length', label: '12 caractères minimum', test: (value) => value.length >= 12 },
  { id: 'upper', label: 'Une majuscule', test: (value) => /\p{Lu}/u.test(value) },
  { id: 'lower', label: 'Une minuscule', test: (value) => /\p{Ll}/u.test(value) },
  { id: 'digit', label: 'Un chiffre', test: (value) => /\d/.test(value) },
  { id: 'special', label: 'Un caractère spécial', test: (value) => /[^\p{L}\p{N}\s]/u.test(value) },
];

export function passwordChecks(value: string): readonly PasswordCheck[] {
  return RULES.map(({ id, label, test }) => ({ id, label, ok: test(value) }));
}
