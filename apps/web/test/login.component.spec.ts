import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { describe, expect, it, vi } from "vitest";
import { AuthStore } from "../src/app/auth/auth.store.js";
import { LoginComponent } from "../src/app/auth/login.component.js";

describe("LoginComponent", () => {
  async function setup(): Promise<{
    fixture: ComponentFixture<LoginComponent>;
    http: HttpTestingController;
    router: Router;
    store: AuthStore;
  }> {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    return {
      fixture,
      http: TestBed.inject(HttpTestingController),
      router: TestBed.inject(Router),
      store: TestBed.inject(AuthStore),
    };
  }

  it("submits username and password credentials to the login API", async () => {
    const { fixture, http } = await setup();

    fixture.componentInstance.form.setValue({
      username: "sa",
      password: "secret",
    });
    fixture.nativeElement
      .querySelector("form")
      .dispatchEvent(new Event("submit"));

    const request = http.expectOne("/api/auth/login");
    expect(request.request.method).toBe("POST");
    expect(request.request.body).toEqual({
      username: "sa",
      password: "secret",
    });

    request.flush({ userId: "sa", roles: ["super_admin"], isSuperAdmin: true });
    http.verify();
  });

  it("disables repeated submission while authentication is loading", async () => {
    const { fixture, http } = await setup();

    fixture.componentInstance.form.setValue({
      username: "sa",
      password: "secret",
    });
    fixture.nativeElement
      .querySelector("form")
      .dispatchEvent(new Event("submit"));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Authenticating...");

    http
      .expectOne("/api/auth/login")
      .flush({ userId: "sa", roles: ["super_admin"], isSuperAdmin: true });
    http.verify();
  });

  it("announces a generic authentication error", async () => {
    const { fixture, http, router } = await setup();
    const navigateByUrl = vi.spyOn(router, "navigateByUrl");

    fixture.componentInstance.form.setValue({
      username: "sa",
      password: "wrong",
    });
    fixture.nativeElement
      .querySelector("form")
      .dispatchEvent(new Event("submit"));

    http
      .expectOne("/api/auth/login")
      .flush(
        { message: "Unauthorized" },
        { status: 401, statusText: "Unauthorized" },
      );
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      "[role='alert']",
    ) as HTMLElement;
    expect(error.textContent).toContain("Invalid credentials");
    expect(error.getAttribute("aria-live")).toBe("assertive");
    expect(navigateByUrl).not.toHaveBeenCalled();
    http.verify();
  });

  it("stores successful authority and navigates to the protected shell", async () => {
    const { fixture, http, router, store } = await setup();
    const navigateByUrl = vi.spyOn(router, "navigateByUrl");

    fixture.componentInstance.form.setValue({
      username: "sa",
      password: "secret",
    });
    fixture.nativeElement
      .querySelector("form")
      .dispatchEvent(new Event("submit"));

    http
      .expectOne("/api/auth/login")
      .flush({ userId: "sa", roles: ["super_admin"], isSuperAdmin: true });

    await fixture.whenStable();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.canProvisionTenants()).toBe(true);
    expect(navigateByUrl).toHaveBeenCalledWith("/");
    http.verify();
  });
});
