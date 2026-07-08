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
import type { CreateCompanyResponse } from "@oc01/contracts";
import { AuthStore } from "../auth/auth.store.js";

interface AuditSignal {
  tone: "danger" | "info" | "warning";
  title: string;
  detail: string;
}

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
              Create tenant and first admin atomically. Bootstrap uses
              one-time-token rotation.
            </p>

            <label>
              Company name
              <input
                [value]="companyName()"
                (input)="companyName.set($any($event.target).value)"
              />
            </label>
            <label>
              Initial admin email
              <input
                [value]="adminEmail()"
                (input)="adminEmail.set($any($event.target).value)"
              />
            </label>

            <button class="primary" type="button" (click)="provisionTenant()">
              Create tenant
            </button>

            @if (feedback(); as message) {
              <p class="feedback" role="status">{{ message }}</p>
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

  readonly companyName = signal("Acme Security");
  readonly adminEmail = signal("admin@acme.example");
  readonly feedback = signal<string | null>(null);
  readonly securityDialogOpen = signal(false);
  private securityDialogInvoker: HTMLElement | null = null;
  readonly activeAuthority = computed(() =>
    this.auth.isSuperAdmin() ? "super_admin" : "tenant",
  );

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

  provisionTenant(): void {
    const payload = {
      companyName: this.companyName(),
      adminEmail: this.adminEmail(),
    };

    this.http
      .post<CreateCompanyResponse>("/api/admin/companies", payload)
      .subscribe({
        next: (response) => {
          const message = `Tenant ${response.companyId} provisioned with one-time-token bootstrap.`;
          this.feedback.set(message);
          void this.liveAnnouncer.announce(message);
        },
        error: () => {
          const message =
            "Provisioning failed because security validation rejected the request.";
          this.feedback.set(message);
          void this.liveAnnouncer.announce(message, "assertive");
        },
      });
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
