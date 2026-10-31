import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../ui/button/button';
import { FormAlert } from '../../ui/form-alert/form-alert';
import { EMAIL_PATTERN, fieldError } from '../../ui/forms/field-error';
import { focusFirstInvalid, invalidSummary } from '../../ui/forms/invalid-summary';
import { Logo } from '../../ui/logo/logo';
import { PasswordRules } from '../../ui/password-rules/password-rules';
import { RadioChips, RadioOption } from '../../ui/radio-chips/radio-chips';
import { TextField } from '../../ui/text-field/text-field';
import { EARLIEST_BIRTH_DATE, latestBirthDate, validBirthDate } from './birth-date';
import { notBlank, passwordRules, sameAs, withoutEmail } from './signup-validators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    FormAlert,
    Logo,
    PasswordRules,
    RadioChips,
    TextField,
  ],
  template: `
    <div class="su">
      <aside class="su-side" aria-hidden="true">
        <app-logo />
        <p class="su-slogan">Ce que tu veux voir,<span>ce que tu as vu.</span></p>
      </aside>
      <main class="su-main">
        @if (welcome(); as done) {
          <section class="su-done" role="status">
            <span class="su-done-badge">Compte créé</span>
            <h1 class="su-h1">Bienvenue, {{ done.firstName }}.</h1>
            <p class="su-lead">
              Ton compte est prêt. Commence par ajouter quelques films ou séries à ta watchlist.
            </p>
            <app-button size="lg" [routerLink]="done.next">Commencer</app-button>
          </section>
        } @else {
          <form class="su-form" novalidate [formGroup]="form" (ngSubmit)="submit()">
            <div class="su-mobile-logo"><app-logo /></div>
            <div>
              <h1 class="su-h1">Créer un compte</h1>
              <p class="su-lead">Tous les champs sont obligatoires.</p>
            </div>
            @if (alert(); as message) {
              <app-form-alert [message]="message" />
            }
            <div class="su-row">
              <app-text-field
                name="firstName"
                label="Prénom"
                autocomplete="given-name"
                [error]="firstNameError()"
                formControlName="firstName"
              />
              <app-text-field
                name="lastName"
                label="Nom"
                autocomplete="family-name"
                [error]="lastNameError()"
                formControlName="lastName"
              />
            </div>
            <app-text-field
              name="birthDate"
              label="Date de naissance"
              type="date"
              autocomplete="bday"
              [error]="birthDateError()"
              [min]="earliestBirthDate"
              [max]="latestBirthDate"
              formControlName="birthDate"
            />
            <app-radio-chips
              name="gender"
              label="Genre"
              [options]="genders"
              [error]="genderError()"
              formControlName="gender"
            />
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
              autocomplete="new-password"
              [error]="passwordError()"
              [describedBy]="rulesId"
              formControlName="password"
            />
            <app-password-rules [id]="rulesId" [value]="password()" [showErrors]="submitted()" />
            <app-text-field
              name="confirmation"
              label="Confirme le mot de passe"
              type="password"
              autocomplete="new-password"
              [error]="confirmationError()"
              formControlName="confirmation"
            />
            <app-button type="submit" size="lg" block>Créer un compte</app-button>
            <p class="su-alt">
              Déjà un compte ? <a class="zb-link" routerLink="/connexion">Se connecter</a>
            </p>
          </form>
        }
      </main>
    </div>
  `,
  styles: `
    .su {
      display: grid;
      grid-template-columns: 1fr 600px;
      min-height: 100vh;
      background: var(--bg);
      color: var(--ink);
    }
    .su-side {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--space-8);
      padding: var(--space-8);
      overflow: hidden;
    }
    .su-slogan {
      margin: 0;
      font: 800 56px/0.95 var(--font-display);
    }
    .su-slogan span {
      display: block;
      color: var(--marquee-ink);
    }
    .su-main {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px var(--space-8);
      background: var(--surface);
      border-left: 1px solid var(--line);
    }
    .su-form {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .su-mobile-logo {
      display: none;
    }
    .su-h1 {
      margin: 0;
      font: 700 40px/42px var(--font-display);
      letter-spacing: 0.01em;
    }
    .su-lead {
      margin: var(--space-2) 0 0;
      color: var(--ink-muted);
      font: 400 15px/23px var(--font-sans);
    }
    .su-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }
    .su-done {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      align-items: flex-start;
    }
    .su-done-badge {
      display: inline-flex;
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      background: var(--seen);
      color: var(--on-seen);
      font: 600 12px/16px var(--font-sans);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .su-alt {
      margin: 0;
      text-align: center;
      color: var(--ink-muted);
      font: 400 14px/20px var(--font-sans);
    }
    @media (max-width: 1023px) {
      .su {
        grid-template-columns: 1fr;
      }
      .su-side {
        display: none;
      }
      .su-main {
        align-items: flex-start;
        border-left: 0;
      }
      .su-mobile-logo {
        display: block;
      }
    }
    @media (max-width: 599px) {
      .su-main {
        padding: var(--space-6) var(--space-4);
      }
      .su-row {
        grid-template-columns: 1fr;
      }
      .su-h1 {
        font-size: 32px;
        line-height: 34px;
      }
    }
  `,
})
export class Signup {
  protected readonly earliestBirthDate = EARLIEST_BIRTH_DATE;
  protected readonly latestBirthDate = latestBirthDate();
  protected readonly rulesId = 'su-rules';
  protected readonly genders: readonly RadioOption[] = [
    { value: 'MALE', label: 'Homme' },
    { value: 'FEMALE', label: 'Femme' },
  ];

  private readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)],
  });
  private readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      passwordRules,
      Validators.maxLength(64),
      withoutEmail(this.email),
    ],
  });
  private readonly confirmation = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, sameAs(this.passwordControl)],
  });

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [notBlank] }),
    lastName: new FormControl('', { nonNullable: true, validators: [notBlank] }),
    birthDate: new FormControl('', { nonNullable: true, validators: [validBirthDate] }),
    gender: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: this.email,
    password: this.passwordControl,
    confirmation: this.confirmation,
  });

  protected readonly alert = signal<string | undefined>(undefined);
  protected readonly submitted = signal(false);
  protected readonly welcome = signal<{ firstName: string; next: string } | undefined>(undefined);
  private readonly auth = inject(AuthService);
  private pending = false;
  private readonly root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly password = toSignal(this.passwordControl.valueChanges, { initialValue: '' });

  protected readonly firstNameError = fieldError(this.form.controls.firstName, {
    required: 'Indique ton prénom.',
  });
  protected readonly lastNameError = fieldError(this.form.controls.lastName, {
    required: 'Indique ton nom.',
  });
  protected readonly birthDateError = fieldError(this.form.controls.birthDate, {
    birthDate: 'Indique une date de naissance valide.',
  });
  protected readonly genderError = fieldError(this.form.controls.gender, {
    required: 'Choisis une option.',
  });
  protected readonly passwordError = fieldError(this.passwordControl, {
    required: 'Choisis un mot de passe.',
    rules: 'Ton mot de passe ne respecte pas encore toutes les règles.',
    maxlength: 'Ton mot de passe ne doit pas dépasser 64 caractères.',
    containsEmail: 'Ton mot de passe ne doit pas contenir ton email.',
  });
  protected readonly confirmationError = fieldError(this.confirmation, {
    required: 'Retape ton mot de passe.',
    mismatch: 'Les deux mots de passe ne correspondent pas.',
  });
  protected readonly emailError = fieldError(this.email, {
    required: 'Indique ton email.',
    pattern: "Cet email n'a pas l'air valide.",
  });

  constructor() {
    this.email.valueChanges.subscribe(() => this.passwordControl.updateValueAndValidity());
    this.passwordControl.valueChanges.subscribe(() => this.confirmation.updateValueAndValidity());
  }

  protected submit(): void {
    if (this.pending) {
      return;
    }
    this.form.markAllAsTouched();
    this.submitted.set(true);
    if (this.form.invalid) {
      this.alert.set(invalidSummary(this.form));
      focusFirstInvalid(this.form, this.root);
      return;
    }
    this.alert.set(undefined);
    this.pending = true;
    const { confirmation: _, ...account } = this.form.getRawValue();
    this.auth
      .register(account)
      .pipe(
        switchMap(() =>
          this.auth.login(account.email, account.password).pipe(
            map(() => '/accueil'),
            catchError(() => of('/connexion')),
          ),
        ),
        finalize(() => (this.pending = false)),
      )
      .subscribe((next) => this.welcome.set({ firstName: account.firstName.trim(), next }));
  }
}
