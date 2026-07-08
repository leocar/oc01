import { Controller, Get, Inject, Param } from "@nestjs/common";
import {
  TenantAccessService,
  type TenantAccessResponse,
} from "./tenant-access.service.js";

@Controller("/api/tenant/companies")
export class TenantAccessController {
  constructor(
    @Inject(TenantAccessService) private readonly access: TenantAccessService,
  ) {}

  @Get(":companyId/admin-access")
  getTenantAdminAccess(
    @Param("companyId") companyId: string,
  ): Promise<TenantAccessResponse> {
    return this.access.getTenantAdminAccess(companyId);
  }
}
