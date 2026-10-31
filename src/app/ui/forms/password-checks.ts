export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'digit' | 'special';

export interface PasswordCheck {
  readonly id: PasswordRuleId;
  readonly label: string;
  readonly ok: boolean;
}

export function passwordChecks(value: string): readonly PasswordCheck[] {
  return [];
}
