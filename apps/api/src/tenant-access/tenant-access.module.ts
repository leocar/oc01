import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { TenantModule } from "../tenant/tenant.module.js";
import { TenantAccessController } from "./tenant-access.controller.js";
import { TenantAccessService } from "./tenant-access.service.js";

@Module({
  imports: [AuditModule, RbacModule, TenantModule],
  controllers: [TenantAccessController],
  providers: [TenantAccessService],
})
export class TenantAccessModule {}
