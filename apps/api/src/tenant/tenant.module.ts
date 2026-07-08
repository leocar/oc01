import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { TenantContextService } from "./tenant-context.service.js";

@Module({
  imports: [AuthModule],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantModule {}
