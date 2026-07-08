import { UnauthorizedException } from "@nestjs/common";
import { generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { TokenValidatorService } from "../src/auth/token-validator.service.js";

function compactToken(header: Record<string, unknown>): string {
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url",
  );
  const encodedPayload = Buffer.from(
    JSON.stringify({ sub: "user-1" }),
  ).toString("base64url");
  return `${encodedHeader}.${encodedPayload}.signature`;
}

describe("TokenValidatorService", () => {
  const service = new TokenValidatorService();

  it("accepts compact JWS headers with allowlisted algorithm", () => {
    expect(() =>
      service.assertProtectedHeader(compactToken({ alg: "RS256" })),
    ).not.toThrow();
  });

  it("maps a valid signed super-admin token to global authority", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const token = await new SignJWT({ roles: ["super_admin"] })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("sa")
      .sign(privateKey);

    await expect(service.verifySessionToken(token, publicKey)).resolves.toEqual(
      {
        userId: "sa",
        companyId: undefined,
        roles: ["super_admin"],
        isSuperAdmin: true,
      },
    );
  });

  it("rejects alg none", () => {
    expect(() =>
      service.assertProtectedHeader(compactToken({ alg: "none" })),
    ).toThrow(UnauthorizedException);
  });

  it("rejects compressed tokens", () => {
    expect(() =>
      service.assertProtectedHeader(compactToken({ alg: "RS256", zip: "DEF" })),
    ).toThrow(UnauthorizedException);
  });

  it("rejects p2c at or above 1000", () => {
    expect(() =>
      service.assertProtectedHeader(compactToken({ alg: "RS256", p2c: 1000 })),
    ).toThrow(UnauthorizedException);
  });

  it("rejects non-compact token formats", () => {
    expect(() => service.assertProtectedHeader("not-a-compact-token")).toThrow(
      UnauthorizedException,
    );
  });
});
