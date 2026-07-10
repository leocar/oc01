import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthCredentialService } from "./auth-credential.service.js";
import { BootstrapAccessService } from "./bootstrap-access.service.js";
import { SessionTokenIssuerService } from "./session-token-issuer.service.js";
import { SessionVerificationKeyService } from "./session-verification-key.service.js";
import { TokenValidatorService } from "./token-validator.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthCredentialService,
    BootstrapAccessService,
    SessionTokenIssuerService,
    SessionVerificationKeyService,
    TokenValidatorService,
  ],
  exports: [
    AuthCredentialService,
    BootstrapAccessService,
    SessionTokenIssuerService,
    SessionVerificationKeyService,
    TokenValidatorService,
  ],
})
export class AuthModule {}
