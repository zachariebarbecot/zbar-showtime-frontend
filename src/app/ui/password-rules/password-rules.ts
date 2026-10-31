import { Component, computed, input } from '@angular/core';
import { passwordChecks } from '../forms/password-checks';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-password-rules',
  imports: [Icon],
  template: `
    <ul [id]="id()" class="zb-rules" aria-label="Règles du mot de passe">
      @for (rule of rules(); track rule.id) {
        <li class="zb-rule" [class]="'zb-rule zb-rule-' + rule.state">
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
      state: check.ok ? 'ok' : this.showErrors() ? 'error' : 'todo',
      icon: check.ok ? 'seen' : this.showErrors() ? 'close' : 'dot',
    } as const)),
  );
}
