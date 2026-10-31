import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { focusFirstInvalid, invalidSummary } from '../../ui/forms/invalid-summary';
import { Button } from '../../ui/button/button';
import { Logo } from '../../ui/logo/logo';
import { TextField } from '../../ui/text-field/text-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Button, FormAlert, Logo, TextField],
  template: `
    <main class="li">
      <app-logo size="lg" />
      <form class="li-card" novalidate [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <h1 class="li-h1">Se connecter</h1>
          <p class="li-lead">Content de te revoir.</p>
        </div>
        @if (summary(); as message) {
          <app-form-alert [message]="message" />
        }
        <app-text-field
          name="email"
          label="Email"
          type="email"
          autocomplete="email"
          [error]="emailError()"
          formControlName="email"
        />
        <app-text-field
          name="password"
          label="Mot de passe"
          type="password"
          autocomplete="current-password"
          [error]="passwordError()"
          formControlName="password"
        />
        <app-button type="submit" size="lg" block>Se connecter</app-button>
        <p class="li-alt">
          Pas encore de compte ? <a class="zb-link" routerLink="/inscription">Créer un compte</a>
        </p>
      </form>
    </main>
  `,
  styles: `
    .li {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      padding: 48px var(--space-4);
      background: var(--bg);
      color: var(--ink);
      box-sizing: border-box;
    }
    .li-card {
      width: 100%;
      max-width: 440px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: var(--space-8);
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
    }
    .li-h1 {
      margin: 0;
      font: 700 40px/42px var(--font-display);
      letter-spacing: 0.01em;
    }
    .li-lead {
      margin: var(--space-2) 0 0;
      color: var(--ink-muted);
      font: 400 15px/23px var(--font-sans);
    }
    .li-alt {
      margin: 0;
      text-align: center;
      color: var(--ink-muted);
      font: 400 14px/20px var(--font-sans);
    }
    @media (max-width: 599px) {
      .li {
        justify-content: flex-start;
        padding: var(--space-6) var(--space-4);
        gap: var(--space-6);
      }
      .li-card {
        padding: var(--space-6) var(--space-4);
      }
      .li-h1 {
        font-size: 32px;
        line-height: 34px;
      }
    }
  `,
})
export class Login {
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly summary = signal<string | undefined>(undefined);

  private readonly root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly formEvents = toSignal(this.form.events);

  protected readonly emailError = computed(() =>
    this.errorOf(this.form.controls.email, {
      required: 'Indique ton email.',
      pattern: "Cet email n'a pas l'air valide.",
    }),
  );
  protected readonly passwordError = computed(() =>
    this.errorOf(this.form.controls.password, { required: 'Indique ton mot de passe.' }),
  );

  private errorOf(control: FormControl, messages: Record<string, string>): string | undefined {
    this.formEvents();
    const failed = Object.keys(control.errors ?? {})[0];
    return control.touched && failed ? messages[failed] : undefined;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.summary.set(invalidSummary(this.form));
      focusFirstInvalid(this.form, this.root);
    }
  }
}
