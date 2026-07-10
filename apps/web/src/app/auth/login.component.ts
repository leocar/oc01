import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import type { LoginRequest, LoginResponse } from "@oc01/contracts";
import { finalize } from "rxjs";
import { AuthStore } from "./auth.store.js";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-shell">
      <section class="login-card" aria-labelledby="login-title">
        <div class="security-glyph" aria-hidden="true">✓</div>
        <p class="eyebrow">SUPER USER ACCESS</p>
        <h1 id="login-title">Sign in as sa</h1>
        <p class="lede">
          Enter the global administrator credentials to open the tenant command
          shell.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            formControlName="username"
            autocomplete="username"
            placeholder="Username: sa"
            [attr.aria-invalid]="
              form.controls.username.invalid && form.controls.username.touched
            "
          />

          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            placeholder="Password"
            [attr.aria-invalid]="
              form.controls.password.invalid && form.controls.password.touched
            "
          />

          @if (errorMessage()) {
            <p class="error" role="alert" aria-live="assertive">
              {{ errorMessage() }}
            </p>
          }

          <button type="submit" [disabled]="form.invalid || isLoading()">
            {{ isLoading() ? "Authenticating..." : "Enter Command Shell" }}
          </button>
        </form>

        <p class="security-note">
          Your session is issued through a hardened secure cookie after the API
          accepts the credentials.
        </p>
      </section>
    </main>
  `,
  styles: [
    `
      .login-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
        background:
          radial-gradient(
            circle at 20% 20%,
            rgba(34, 211, 238, 0.2),
            transparent 28%
          ),
          radial-gradient(
            circle at 80% 0%,
            rgba(124, 58, 237, 0.24),
            transparent 32%
          ),
          linear-gradient(135deg, #060816 0%, #101827 52%, #04111f 100%);
        color: #f9fafb;
        font-family: "IBM Plex Sans", system-ui, sans-serif;
      }
      .login-card {
        width: min(420px, calc(100vw - 32px));
        padding: 36px 28px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 32px;
        background: rgba(15, 23, 42, 0.72);
        box-shadow:
          0 24px 80px rgba(6, 182, 212, 0.18),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(22px);
      }
      .security-glyph {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 18px;
        background: rgba(34, 211, 238, 0.14);
        color: #67e8f9;
        font-size: 24px;
        font-weight: 800;
      }
      .eyebrow {
        margin: 24px 0 8px;
        color: #67e8f9;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.18em;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 8vw, 3rem);
        line-height: 1;
      }
      .lede,
      .security-note {
        color: #cbd5e1;
        line-height: 1.6;
      }
      .login-form {
        display: grid;
        gap: 12px;
        margin-top: 28px;
      }
      label {
        color: #e2e8f0;
        font-size: 0.9rem;
        font-weight: 700;
      }
      input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: 16px;
        padding: 14px 16px;
        background: rgba(2, 6, 23, 0.62);
        color: #f8fafc;
        font: inherit;
        outline: none;
      }
      input:focus {
        border-color: #67e8f9;
        box-shadow: 0 0 0 4px rgba(103, 232, 249, 0.14);
      }
      button {
        margin-top: 8px;
        border: 0;
        border-radius: 999px;
        padding: 15px 18px;
        background: linear-gradient(135deg, #22d3ee, #8b5cf6);
        color: #020617;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }
      .error {
        margin: 4px 0 0;
        border: 1px solid rgba(248, 113, 113, 0.44);
        border-radius: 14px;
        padding: 12px;
        background: rgba(127, 29, 29, 0.28);
        color: #fecaca;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    username: ["sa", [Validators.required]],
    password: ["", [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.http
      .post<LoginResponse>(
        "/api/auth/login",
        this.form.getRawValue() satisfies LoginRequest,
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (authority) => {
          this.auth.applyLoginAuthority(authority);
          void this.router.navigateByUrl("/");
        },
        error: () => {
          this.errorMessage.set(
            "Invalid credentials. Check the username and password, then try again.",
          );
        },
      });
  }
}
