import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { AuditService } from "../audit/audit.service.js";
import { EnumerationProtectionService } from "../audit/enumeration-protection.service.js";
import { RbacService } from "../rbac/rbac.service.js";
import { TenantContextService } from "../tenant/tenant-context.service.js";

export interface TenantAccessResponse {
  companyId: string;
  access: "granted";
}

@Injectable()
export class TenantAccessService {
  constructor(
    @Inject(AuditService)
    private readonly audit: AuditService,
    @Inject(EnumerationProtectionService)
    private readonly enumeration: EnumerationProtectionService,
    @Inject(RbacService)
    private readonly rbac: RbacService,
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,
  ) {}

  async getTenantAdminAccess(companyId: string): Promise<TenantAccessResponse> {
    const actor = this.tenantContext.getRequired();
    if (actor.sourceIp && (await this.isSourceBlocked(actor.sourceIp))) {
      throw new HttpException(
        "Access temporarily blocked after repeated cross-tenant probes.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      this.rbac.assertTenantPermission(actor, companyId, "tenant:admin");
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.recordCrossTenantDenial(actor, companyId);
      }
      throw error;
    }

    return { companyId, access: "granted" };
  }

  private async isSourceBlocked(sourceIp: string): Promise<boolean> {
    try {
      return await this.enumeration.isBlocked(sourceIp);
    } catch {
      return false;
    }
  }

  private async recordCrossTenantDenial(
    actor: AuthContext,
    targetCompanyId: string,
  ): Promise<void> {
    try {
      await this.audit.record({
        companyId: actor.companyId,
        actorUserId: actor.userId,
        sourceIp: actor.sourceIp,
        eventType: "cross_tenant_denied",
        targetType: "company",
        targetId: targetCompanyId,
        reason: "scope_mismatch",
        metadata: { attemptedPermission: "tenant:admin" },
      });
    } catch {
      // Audit persistence is best-effort; the denial response must still hold.
    }

    if (!actor.sourceIp) {
      return;
    }

    try {
      await this.enumeration.recordDeniedLookup(actor.sourceIp);
    } catch {
      // Denial enforcement must not depend on best-effort abuse telemetry writes.
    }
  }
}
