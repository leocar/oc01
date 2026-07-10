import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { SessionTokenIssuerService } from "../auth/session-token-issuer.service.js";
import { SessionVerificationKeyService } from "../auth/session-verification-key.service.js";
import { DatabaseService } from "../database/database.service.js";

export interface HealthResponse {
  status: "ok";
}

@Controller("health")
export class HealthController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(SessionTokenIssuerService)
    private readonly sessionTokens: SessionTokenIssuerService,
    @Inject(SessionVerificationKeyService)
    private readonly sessionVerificationKeys: SessionVerificationKeyService,
  ) {}

  @Get("live")
  live(): HealthResponse {
    return { status: "ok" };
  }

  @Get("ready")
  async ready(): Promise<HealthResponse> {
    try {
      await this.database.query("SELECT 1 AS ready");
      await this.sessionTokens.assertReady();
      const verificationKey = await this.sessionVerificationKeys.getKey();
      await this.sessionTokens.assertCompatibleWith(verificationKey);
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Readiness check failed.");
    }
  }
}
