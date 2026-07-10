import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Res,
} from "@nestjs/common";
import type { LoginRequest, LoginResponse } from "@oc01/contracts";
import type { Response } from "express";
import { AuthCredentialService } from "./auth-credential.service.js";
import { sessionCookieOptions } from "./session-cookie.js";
import { SessionTokenIssuerService } from "./session-token-issuer.service.js";

@Controller("/api/auth")
export class AuthController {
  constructor(
    @Inject(AuthCredentialService)
    private readonly credentials: AuthCredentialService,
    @Inject(SessionTokenIssuerService)
    private readonly sessions: SessionTokenIssuerService,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() request: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const authority = await this.credentials.verify(parseLoginRequest(request));
    const token = await this.sessions.issue(authority);

    response.cookie("session", token, sessionCookieOptions());

    return authority;
  }
}

function parseLoginRequest(request: unknown): LoginRequest {
  if (
    !request ||
    typeof request !== "object" ||
    typeof (request as Partial<LoginRequest>).username !== "string" ||
    typeof (request as Partial<LoginRequest>).password !== "string"
  ) {
    throw new BadRequestException("Username and password are required.");
  }

  return request as LoginRequest;
}
