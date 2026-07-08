import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="login-shell">
      <section class="login-card" aria-labelledby="login-title">
        <p class="eyebrow">Secure access required</p>
        <h1 id="login-title">Sign in to continue</h1>
        <p>Use a privileged account to access the tenant command workspace.</p>
        <a routerLink="/">Return to command shell</a>
      </section>
    </main>
  `,
  styles: [
    `
      .login-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #080b14;
        color: #f9fafb;
        font-family: "IBM Plex Sans", system-ui, sans-serif;
      }
      .login-card {
        width: min(420px, calc(100vw - 32px));
        padding: 32px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 28px;
        background: rgba(17, 24, 39, 0.82);
        box-shadow: 0 24px 80px rgba(6, 182, 212, 0.18);
      }
      .eyebrow,
      a {
        color: #67e8f9;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {}
