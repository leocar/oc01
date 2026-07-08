import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AuditService } from "./audit.service.js";
import { EnumerationProtectionService } from "./enumeration-protection.service.js";

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, EnumerationProtectionService],
  exports: [AuditService, EnumerationProtectionService],
})
export class AuditModule {}
