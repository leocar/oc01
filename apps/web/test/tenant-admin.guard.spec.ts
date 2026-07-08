import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { describe, expect, it } from "vitest";
import { AuthStore } from "../src/app/auth/auth.store.js";
import { tenantAdminGuard } from "../src/app/auth/tenant-admin.guard.js";

describe("tenantAdminGuard", () => {
  it("allows super-admin users", () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    TestBed.inject(AuthStore).setState({
      userId: "sa",
      companyId: null,
      roles: ["super_admin"],
    });

    const result = TestBed.runInInjectionContext(() =>
      tenantAdminGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it("redirects non-admin users to login", () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });

    const result = TestBed.runInInjectionContext(() =>
      tenantAdminGuard({} as never, {} as never),
    );

    expect(result).toEqual(TestBed.inject(Router).parseUrl("/login"));
  });
});
