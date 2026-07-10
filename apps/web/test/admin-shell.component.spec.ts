import { LiveAnnouncer } from "@angular/cdk/a11y";
import { HttpClient } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Subject, of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { AdminShellComponent } from "../src/app/shell/admin-shell.component.js";

describe("AdminShellComponent", () => {
  async function createComponent(options?: {
    post?: ReturnType<typeof vi.fn>;
    announce?: ReturnType<typeof vi.fn>;
  }) {
    const liveAnnouncer = {
      announce: options?.announce ?? vi.fn().mockResolvedValue(undefined),
    };
    const http = { post: options?.post ?? vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: http },
        { provide: LiveAnnouncer, useValue: liveAnnouncer },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
    return { fixture, http, liveAnnouncer };
  }

  it("renders dark security shell and focus-trapped policy dialog", async () => {
    const { fixture } = await createComponent();
    fixture.componentInstance.securityDialogOpen.set(true);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("SaaS Tenant Command");
    expect(text).toContain("RLS policy");
    expect(text).toContain("403 cross-tenant access denied");
    expect(
      fixture.nativeElement.querySelector("[cdkTrapFocus]"),
    ).not.toBeNull();
  });

  it("blocks malformed provisioning input locally with accessible field errors", async () => {
    const post = vi.fn();
    const { fixture, liveAnnouncer } = await createComponent({ post });

    fixture.componentInstance.companyName.set("");
    fixture.componentInstance.adminEmail.set("not-an-email");
    fixture.componentInstance.provisionTenant();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(post).not.toHaveBeenCalled();
    expect(text).toContain("Company name is required.");
    expect(text).toContain("Enter a valid initial admin email address.");
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Fix the highlighted fields before creating a company.",
      "assertive",
    );
  });

  it("blocks duplicate provisioning submits while the request is pending", async () => {
    const request = new Subject<never>();
    const post = vi.fn().mockReturnValue(request.asObservable());
    const { fixture } = await createComponent({ post });

    fixture.componentInstance.companyName.set("Acme Security");
    fixture.componentInstance.adminEmail.set("admin@acme.example");
    fixture.componentInstance.provisionTenant();
    fixture.componentInstance.provisionTenant();
    fixture.detectChanges();

    const submit = fixture.nativeElement.querySelector(
      "button[type='submit']",
    ) as HTMLButtonElement;
    const text = fixture.nativeElement.textContent as string;

    expect(post).toHaveBeenCalledWith("/api/admin/companies", {
      companyName: "Acme Security",
      adminEmail: "admin@acme.example",
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    expect(text).toContain("Creating company and initial tenant_admin...");
  });

  it("renders non-secret provisioning success metadata accessibly", async () => {
    const { fixture, liveAnnouncer } = await createComponent({
      post: vi.fn().mockReturnValue(
        of({
          companyId: "company-1",
          adminUserId: "admin-1",
          bootstrapAccessMode: "one_time_token",
          forceRotateOnFirstUse: true,
        }),
      ),
    });

    fixture.componentInstance.companyName.set("Acme Security");
    fixture.componentInstance.adminEmail.set("admin@acme.example");
    fixture.componentInstance.provisionTenant();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain("Company provisioned");
    expect(text).toContain("company-1");
    expect(text).toContain("admin-1");
    expect(text).toContain("one_time_token; rotation required on first use.");
    expect(text).toContain(
      "No passwords, tokens, or bootstrap secrets are displayed.",
    );
    expect(text).not.toContain("password:");
    expect(text).not.toContain("secret:");
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Company company-1 provisioned with initial tenant_admin admin-1. Bootstrap policy metadata only; no secrets displayed.",
    );
  });

  it("announces security validation errors accessibly", async () => {
    const { fixture, liveAnnouncer } = await createComponent({
      post: vi.fn().mockReturnValue(throwError(() => new Error("Forbidden"))),
    });
    fixture.componentInstance.companyName.set("Acme Security");
    fixture.componentInstance.adminEmail.set("admin@acme.example");
    fixture.componentInstance.provisionTenant();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "Company provisioning failed. No secrets were returned or displayed.",
    );
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Company provisioning failed. No secrets were returned or displayed.",
      "assertive",
    );
  });

  it("restores focus to the review policy button after closing the security dialog", async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll("button"),
    ) as HTMLButtonElement[];
    const reviewButton = buttons.find(
      (button) => button.textContent?.trim() === "Review policy",
    );

    reviewButton?.focus();
    reviewButton?.click();
    fixture.detectChanges();

    fixture.componentInstance.closeSecurityDialog();
    fixture.detectChanges();

    expect(document.activeElement).toBe(reviewButton);
  });
});
