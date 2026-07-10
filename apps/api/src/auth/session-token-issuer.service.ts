import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { LoginResponse } from "@oc01/contracts";
import { importPKCS8, jwtVerify, SignJWT, type KeyLike } from "jose";

const SESSION_READINESS_PROBE_SUBJECT = "session-readiness-probe";

@Injectable()
export class SessionTokenIssuerService {
  private cachedKey?: Promise<KeyLike>;

  async issue(authority: LoginResponse): Promise<string> {
    return new SignJWT({ roles: authority.roles })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(authority.userId)
      .setIssuedAt()
      .sign(await this.getKey());
  }

  async assertReady(): Promise<void> {
    await this.getKey();
  }

  async assertCompatibleWith(
    verificationKey: KeyLike | Uint8Array,
  ): Promise<void> {
    const probeToken = await new SignJWT({ readiness: true })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject(SESSION_READINESS_PROBE_SUBJECT)
      .setIssuedAt()
      .sign(await this.getKey());

    await jwtVerify(probeToken, verificationKey, {
      algorithms: ["RS256"],
    });
  }

  private async getKey(): Promise<KeyLike> {
    if (!this.cachedKey) {
      this.cachedKey = this.loadKey();
    }

    return this.cachedKey;
  }

  private async loadKey(): Promise<KeyLike> {
    const configuredKey = process.env.AUTH_SESSION_PRIVATE_KEY;
    if (!configuredKey) {
      throw new UnauthorizedException("Session signing key is not configured.");
    }

    return importPKCS8(configuredKey.replace(/\\n/g, "\n"), "RS256");
  }
}
