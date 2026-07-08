import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { TenantModule } from "../tenant/tenant.module.js";
import { CompaniesController } from "./companies.controller.js";
import { CompaniesService } from "./companies.service.js";

@Module({
  imports: [AuditModule, DatabaseModule, TenantModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
