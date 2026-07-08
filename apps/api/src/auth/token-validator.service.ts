import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthContext, RoleCode } from "@oc01/contracts";
import { decodeProtectedHeader, jwtVerify, type KeyLike } from "jose";

const ACCEPTED_ALGORITHMS = ["RS256"] as const;
const MAX_ACCEPTED_P2C = 999;

interface SessionClaims {
  sub?: string;
  company_id?: string;
  roles?: RoleCode[];
  role?: RoleCode;
}

@Injectable()
export class TokenValidatorService {
  async verifySessionToken(
    token: string,
    key: KeyLike | Uint8Array,
  ): Promise<AuthContext> {
    this.assertProtectedHeader(token);

    const { payload } = await jwtVerify<SessionClaims>(token, key, {
      algorithms: [...ACCEPTED_ALGORITHMS],
    });

    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedException("Session token is missing subject.");
    }

    const roles = payload.roles ?? (payload.role ? [payload.role] : []);
    const isSuperAdmin = roles.includes("super_admin");

    return {
      userId,
      companyId: payload.company_id,
      roles,
      isSuperAdmin,
    };
  }

  assertProtectedHeader(token: string): void {
    if (token.split(".").length !== 3) {
      throw new UnauthorizedException("Only compact JWS tokens are accepted.");
    }

    const header = decodeProtectedHeader(token) as Record<string, unknown>;
    if (header.alg === "none") {
      throw new UnauthorizedException("Unsecured tokens are rejected.");
    }
    if (!ACCEPTED_ALGORITHMS.includes(header.alg as "RS256")) {
      throw new UnauthorizedException("Token algorithm is not allowlisted.");
    }
    if ("zip" in header) {
      throw new UnauthorizedException("Compressed tokens are rejected.");
    }
    if (typeof header.p2c === "number" && header.p2c > MAX_ACCEPTED_P2C) {
      throw new UnauthorizedException("Token p2c exceeds accepted bound.");
    }
  }
}
