import { A11yModule, LiveAnnouncer } from "@angular/cdk/a11y";
import { NgClass } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import type {
  CreateCompanyRequest,
  CreateCompanyResponse,
} from "@oc01/contracts";
import { AuthStore } from "../auth/auth.store.js";

interface AuditSignal {
  tone: "danger" | "info" | "warning";
  title: string;
  detail: string;
}

type ProvisioningViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "success";
      companyId: string;
      adminUserId: string;
      bootstrapAccessMode: string;
      forceRotateOnFirstUse: true;
      companyName: string;
      adminEmail: string;
    }
  | { kind: "error"; message: string };

@Component({
  selector: "oc01-admin-shell",
  standalone: true,
  imports: [A11yModule, NgClass],
  template: `
    <main class="workspace">
      <aside class="sidebar glass-panel" aria-label="Admin navigation">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">S</div>
          <div>
            <strong>OC01 Control</strong>
            <span>Tenant Security</span>
          </div>
        </div>

        <nav>
          <button class="nav-item active" type="button">Provisioning</button>
          <button class="nav-item" type="button">Tenants</button>
          <button class="nav-item" type="button">Audit Log</button>
          <button class="nav-item" type="button">RLS Policies</button>
        </nav>

        <section class="posture" aria-label="Isolation status">
          <span>Isolation status</span>
          <strong>RLS Active</strong>
          <p>Backend and persistence boundaries enforced.</p>
        </section>
      </aside>

      <section class="content">
        <header class="topbar glass-panel">
          <div>
            <p class="eyebrow">
              super_admin provisioning and isolation monitoring
            </p>
            <h1>SaaS Tenant Command</h1>
          </div>
          <span class="authority">super_admin</span>
        </header>

        <section class="metrics" aria-label="Security metrics">
          <article class="metric glass-panel">
            <span>Tenants</span>
            <strong>24</strong>
            <p>Company-scoped admins</p>
          </article>
          <article class="metric danger glass-panel">
            <span>Denied cross-tenant</span>
            <strong>7</strong>
            <p>Audited with actor and reason</p>
          </article>
          <article class="metric success glass-panel">
            <span>RLS policy</span>
            <strong>ON</strong>
            <p>SESSION_CONTEXT verified</p>
          </article>
        </section>

        <section class="panels">
          <article
            class="glass-panel provision"
            aria-labelledby="provision-title"
          >
            <h2 id="provision-title">Provision Company</h2>
            <p>
              Create a company and its first company-scoped tenant_admin in one
              provisioning action. Confirmation only shows non-secret metadata.
            </p>

            <form
              class="provision-form"
              (submit)="provisionTenant($event)"
              novalidate
            >
              <label>
                Company name
                <input
                  name="companyName"
                  autocomplete="organization"
                  [attr.aria-invalid]="companyNameError() ? 'true' : null"
                  [attr.aria-describedby]="
                    companyNameError() ? 'company-name-error' : null
                  "
                  [value]="companyName()"
                  [disabled]="isSubmitting()"
                  (blur)="companyNameTouched.set(true)"
                  (input)="updateCompanyName($any($event.target).value)"
                />
              </label>
              @if (companyNameError(); as error) {
                <p id="company-name-error" class="field-error" role="alert">
                  {{ error }}
                </p>
              }

              <label>
                Initial admin email
                <input
                  name="adminEmail"
                  type="email"
                  autocomplete="email"
                  [attr.aria-invalid]="adminEmailError() ? 'true' : null"
                  [attr.aria-describedby]="
                    adminEmailError() ? 'admin-email-error' : null
                  "
                  [value]="adminEmail()"
                  [disabled]="isSubmitting()"
                  (blur)="adminEmailTouched.set(true)"
                  (input)="updateAdminEmail($any($event.target).value)"
                />
              </label>
              @if (adminEmailError(); as error) {
                <p id="admin-email-error" class="field-error" role="alert">
                  {{ error }}
                </p>
              }

              <button class="primary" type="submit" [disabled]="isSubmitting()">
                {{ isSubmitting() ? "Creating company..." : "Create company" }}
              </button>
            </form>

            @if (viewState().kind === "submitting") {
              <p class="feedback pending" role="status" aria-live="polite">
                Creating company and initial tenant_admin...
              </p>
            }

            @if (successState(); as success) {
              <section
                class="feedback success-panel"
                role="status"
                aria-live="polite"
              >
                <h3>Company provisioned</h3>
                <dl>
                  <div>
                    <dt>Company</dt>
                    <dd>{{ success.companyName }}</dd>
                  </div>
                  <div>
                    <dt>Initial admin</dt>
                    <dd>{{ success.adminEmail }}</dd>
                  </div>
                  <div>
                    <dt>Company ID</dt>
                    <dd>{{ success.companyId }}</dd>
                  </div>
                  <div>
                    <dt>Admin user ID</dt>
                    <dd>{{ success.adminUserId }}</dd>
                  </div>
                  <div>
                    <dt>Bootstrap policy</dt>
                    <dd>
                      {{ success.bootstrapAccessMode }}; rotation required on
                      first use.
                    </dd>
                  </div>
                </dl>
                <p>No passwords, tokens, or bootstrap secrets are displayed.</p>
              </section>
            }

            @if (errorState(); as error) {
              <p
                class="feedback error-panel"
                role="alert"
                aria-live="assertive"
              >
                {{ error.message }}
              </p>
            }
          </article>

          <article class="glass-panel audit" aria-labelledby="audit-title">
            <div class="audit-header">
              <h2 id="audit-title">Audit Signals</h2>
              <button type="button" (click)="openSecurityDialog($event)">
                Review policy
              </button>
            </div>

            @for (signal of auditSignals; track signal.title) {
              <div class="audit-row" [ngClass]="signal.tone">
                <strong>{{ signal.title }}</strong>
                <span>{{ signal.detail }}</span>
              </div>
            }
          </article>
        </section>
      </section>

      @if (securityDialogOpen()) {
        <section class="dialog-backdrop" role="presentation">
          <div
            class="dialog glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            cdkTrapFocus
          >
            <h2 id="dialog-title">Security validation policy</h2>
            <p>
              Denied cross-tenant access is audited. Enumeration thresholds
              trigger temporary protection.
            </p>
            <button type="button" (click)="closeSecurityDialog()">Close</button>
          </div>
        </section>
      }
    </main>
  `,
  styleUrl: "./admin-shell.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private readonly auth = inject(AuthStore);
  private readonly http = inject(HttpClient);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly companyName = signal("");
  readonly adminEmail = signal("");
  readonly companyNameTouched = signal(false);
  readonly adminEmailTouched = signal(false);
  readonly viewState = signal<ProvisioningViewState>({ kind: "idle" });
  readonly securityDialogOpen = signal(false);
  private securityDialogInvoker: HTMLElement | null = null;
  readonly auditSignals: AuditSignal[] = [
    {
      tone: "danger",
      title: "403 cross-tenant access denied",
      detail: "actor=tenant_admin target=Tenant B reason=scope_mismatch",
    },
    {
      tone: "info",
      title: "SESSION_CONTEXT set for transaction",
      detail: "company_id=UUID-A policy=TenantSecurityPolicy",
    },
    {
      tone: "warning",
      title: "Enumeration threshold approaching",
      detail: "source=203.0.113.42 denied=4 window=10m",
    },
  ];

  readonly isSubmitting = computed(
    () => this.viewState().kind === "submitting",
  );
  readonly companyNameError = computed(() => {
    if (!this.companyNameTouched()) {
      return null;
    }
    return this.companyName().trim() ? null : "Company name is required.";
  });
  readonly adminEmailError = computed(() => {
    if (!this.adminEmailTouched()) {
      return null;
    }
    return this.isValidEmail(this.adminEmail().trim())
      ? null
      : "Enter a valid initial admin email address.";
  });
  readonly successState = computed(() => {
    const state = this.viewState();
    return state.kind === "success" ? state : null;
  });
  readonly errorState = computed(() => {
    const state = this.viewState();
    return state.kind === "error" ? state : null;
  });

  updateCompanyName(value: string): void {
    this.companyName.set(value);
    this.viewState.set({ kind: "idle" });
  }

  updateAdminEmail(value: string): void {
    this.adminEmail.set(value);
    this.viewState.set({ kind: "idle" });
  }

  provisionTenant(event?: Event): void {
    event?.preventDefault();
    if (this.isSubmitting()) {
      return;
    }

    this.companyNameTouched.set(true);
    this.adminEmailTouched.set(true);

    const payload: CreateCompanyRequest = {
      companyName: this.companyName().trim(),
      adminEmail: this.adminEmail().trim(),
    };

    if (!payload.companyName || !this.isValidEmail(payload.adminEmail)) {
      const message = "Fix the highlighted fields before creating a company.";
      this.viewState.set({ kind: "error", message });
      void this.liveAnnouncer.announce(message, "assertive");
      return;
    }

    this.viewState.set({ kind: "submitting" });

    this.http
      .post<CreateCompanyResponse>("/api/admin/companies", payload)
      .subscribe({
        next: (response) => {
          this.viewState.set({
            kind: "success",
            companyId: response.companyId,
            adminUserId: response.adminUserId,
            bootstrapAccessMode: response.bootstrapAccessMode,
            forceRotateOnFirstUse: response.forceRotateOnFirstUse,
            companyName: payload.companyName,
            adminEmail: payload.adminEmail,
          });
          const message = `Company ${response.companyId} provisioned with initial tenant_admin ${response.adminUserId}. Bootstrap policy metadata only; no secrets displayed.`;
          void this.liveAnnouncer.announce(message);
        },
        error: () => {
          const message =
            "Company provisioning failed. No secrets were returned or displayed.";
          this.viewState.set({ kind: "error", message });
          void this.liveAnnouncer.announce(message, "assertive");
        },
      });
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  openSecurityDialog(event: Event): void {
    this.securityDialogInvoker = event.currentTarget as HTMLElement;
    this.securityDialogOpen.set(true);
  }

  closeSecurityDialog(): void {
    this.securityDialogOpen.set(false);
    this.securityDialogInvoker?.focus();
  }
}
