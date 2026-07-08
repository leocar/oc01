import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { BootstrapAccessService } from "./bootstrap-access.service.js";
import { SessionVerificationKeyService } from "./session-verification-key.service.js";
import { TokenValidatorService } from "./token-validator.service.js";

@Module({
  imports: [DatabaseModule],
  providers: [
    BootstrapAccessService,
    SessionVerificationKeyService,
    TokenValidatorService,
  ],
  exports: [
    BootstrapAccessService,
    SessionVerificationKeyService,
    TokenValidatorService,
  ],
})
export class AuthModule {}
