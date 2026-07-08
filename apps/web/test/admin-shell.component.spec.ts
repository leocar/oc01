import { LiveAnnouncer } from "@angular/cdk/a11y";
import { HttpClient } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { AdminShellComponent } from "../src/app/shell/admin-shell.component.js";

describe("AdminShellComponent", () => {
  it("renders dark security shell and focus-trapped policy dialog", async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { post: vi.fn() } },
        { provide: LiveAnnouncer, useValue: { announce: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
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

  it("announces provisioning success accessibly", async () => {
    const liveAnnouncer = { announce: vi.fn().mockResolvedValue(undefined) };
    const http = {
      post: vi.fn().mockReturnValue(
        of({
          companyId: "company-1",
          adminUserId: "admin-1",
          bootstrapAccessMode: "one_time_token",
          forceRotateOnFirstUse: true,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: http },
        { provide: LiveAnnouncer, useValue: liveAnnouncer },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
    fixture.componentInstance.provisionTenant();

    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Tenant company-1 provisioned with one-time-token bootstrap.",
    );
  });

  it("announces security validation errors accessibly", async () => {
    const liveAnnouncer = { announce: vi.fn().mockResolvedValue(undefined) };
    const http = {
      post: vi.fn().mockReturnValue(throwError(() => new Error("Forbidden"))),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: http },
        { provide: LiveAnnouncer, useValue: liveAnnouncer },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
    fixture.componentInstance.provisionTenant();

    expect(fixture.componentInstance.feedback()).toBe(
      "Provisioning failed because security validation rejected the request.",
    );
    expect(liveAnnouncer.announce).toHaveBeenCalledWith(
      "Provisioning failed because security validation rejected the request.",
      "assertive",
    );
  });

  it("restores focus to the review policy button after closing the security dialog", async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { post: vi.fn() } },
        { provide: LiveAnnouncer, useValue: { announce: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
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
