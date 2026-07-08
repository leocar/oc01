import { describe, expect, it } from "vitest";
import { sessionCookieOptions } from "../src/auth/session-cookie.js";

describe("sessionCookieOptions", () => {
  it("sets hardened cookie attributes", () => {
    expect(sessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });
  });
});
