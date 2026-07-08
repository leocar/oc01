import { Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router, RouterOutlet } from "@angular/router";
import { describe, expect, it } from "vitest";
import { routes } from "../src/app/app.routes.js";

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class TestHostComponent {}

describe("app routes", () => {
  it("redirects default entry to /login when no authenticated session exists", async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    }).compileComponents();

    TestBed.createComponent(TestHostComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl("/");

    expect(router.url).toBe("/login");
  });
});
