import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import type { NextFunction, Request, Response } from "express";
import { SessionVerificationKeyService } from "../auth/session-verification-key.service.js";
import { TokenValidatorService } from "../auth/token-validator.service.js";
import { TenantContextService } from "./tenant-context.service.js";

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    @Inject(SessionVerificationKeyService)
    private readonly sessionVerificationKey: SessionVerificationKeyService,
    @Inject(TokenValidatorService)
    private readonly tokenValidator: TokenValidatorService,
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,
  ) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    void this.attachContext(request, next);
  }

  private async attachContext(
    request: Request,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = this.extractSessionToken(request);
      if (!token) {
        next();
        return;
      }

      const verifiedContext = await this.tokenValidator.verifySessionToken(
        token,
        await this.sessionVerificationKey.getKey(),
      );
      const context: AuthContext = {
        ...verifiedContext,
        sourceIp: this.resolveSourceIp(request),
      };

      this.tenantContext.run(context, next);
    } catch (error) {
      next(error);
    }
  }

  private extractSessionToken(request: Request): string | undefined {
    const authorization = request.header("authorization");
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length).trim();
      if (!token) {
        throw new UnauthorizedException("Bearer token is empty.");
      }
      return token;
    }

    const cookies = request.header("cookie");
    if (!cookies) {
      return undefined;
    }

    return cookies
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("session="))
      ?.slice("session=".length);
  }

  private resolveSourceIp(request: Request): string | undefined {
    if (process.env.TRUST_PROXY_X_FORWARDED_FOR === "true") {
      const forwardedFor = this.header(request, "x-forwarded-for")
        ?.split(",")
        .map((value) => value.trim())
        .find(Boolean);
      if (forwardedFor) {
        return forwardedFor;
      }
    }

    return request.ip;
  }

  private header(request: Request, name: string): string | undefined {
    const value = request.header(name);
    return value && value.length > 0 ? value : undefined;
  }
}
