import { Injectable, UnauthorizedException } from "@nestjs/common";
import { importSPKI, type KeyLike } from "jose";

@Injectable()
export class SessionVerificationKeyService {
  private cachedKey?: Promise<KeyLike | Uint8Array>;

  async getKey(): Promise<KeyLike | Uint8Array> {
    if (!this.cachedKey) {
      this.cachedKey = this.loadKey();
    }

    return this.cachedKey;
  }

  private async loadKey(): Promise<KeyLike | Uint8Array> {
    const configuredKey = process.env.AUTH_SESSION_PUBLIC_KEY;
    if (!configuredKey) {
      throw new UnauthorizedException(
        "Session verification key is not configured.",
      );
    }

    return importSPKI(configuredKey.replace(/\\n/g, "\n"), "RS256");
  }
}
