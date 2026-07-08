import { HttpRequest } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { AuthStore } from "../src/app/auth/auth.store.js";
import { tenantHttpInterceptor } from "../src/app/auth/tenant-http.interceptor.js";

describe("tenantHttpInterceptor", () => {
  it("injects X-Company-ID when tenant context exists", () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.inject(AuthStore).setState({
      userId: "u1",
      companyId: "c1",
      roles: ["tenant_admin"],
    });

    const request = new HttpRequest("GET", "/api/users");
    const result = TestBed.runInInjectionContext(() => {
      return tenantHttpInterceptor(request, (next) => {
        expect(next.headers.get("X-Company-ID")).toBe("c1");
        return null as never;
      });
    });

    expect(result).toBeNull();
  });
});
