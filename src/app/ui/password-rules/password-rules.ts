import { Component, computed, input } from '@angular/core';
import { passwordChecks } from '../forms/password-checks';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-password-rules',
  imports: [Icon],
  template: `
    <ul [id]="id()" class="zb-rules" aria-label="Règles du mot de passe">
      @for (rule of rules(); track rule.id) {
        <li [class]="'zb-rule zb-rule-' + rule.state">
          <svg appIcon [name]="rule.icon"></svg>
          <span>
            {{ rule.label }}
            <span class="zb-sr">{{ rule.ok ? ' : respectée' : ' : manquante' }}</span>
          </span>
        </li>
      }
    </ul>
  `,
})
export class PasswordRules {
  readonly id = input.required<string>();
  readonly value = input.required<string>();
  readonly showErrors = input(false);

  protected readonly rules = computed(() =>
    passwordChecks(this.value()).map((check) => ({
      ...check,
      ...this.presentation(check.ok),
    })),
  );

  private presentation(ok: boolean) {
    if (ok) return { state: 'ok', icon: 'seen' } as const;
    return this.showErrors()
      ? ({ state: 'error', icon: 'close' } as const)
      : ({ state: 'todo', icon: 'dot' } as const);
  }
}
