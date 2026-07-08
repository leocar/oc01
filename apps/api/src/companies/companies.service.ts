import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import type {
  CreateCompanyRequest,
  CreateCompanyResponse,
} from "@oc01/contracts";
import { AuditService } from "../audit/audit.service.js";
import { DatabaseService } from "../database/database.service.js";
import { TenantContextService } from "../tenant/tenant-context.service.js";

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(AuditService)
    private readonly audit: AuditService,
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,
  ) {}

  async createCompany(
    request: CreateCompanyRequest,
  ): Promise<CreateCompanyResponse> {
    const actor = this.tenantContext.getRequired();
    if (!actor.isSuperAdmin) {
      throw new ForbiddenException("Only super_admin can provision companies.");
    }

    return this.database.transaction(async (tx) => {
      await this.database.applySessionContext(actor, tx);

      const company = await tx.query<{ id: string }>(
        `INSERT INTO dbo.companies (name)
         OUTPUT INSERTED.id
         VALUES (@companyName)`,
        { companyName: request.companyName },
      );
      const companyId = company.rows[0]?.id;
      if (!companyId) {
        throw new InternalServerErrorException(
          "Company provisioning did not return a company id.",
        );
      }

      const admin = await tx.query<{ id: string }>(
        `INSERT INTO dbo.users (company_id, email, bootstrap_access_token_hash, force_credential_rotation)
         OUTPUT INSERTED.id
         VALUES (@companyId, @adminEmail, CONVERT(NVARCHAR(512), NEWID()), 1)`,
        { companyId, adminEmail: request.adminEmail },
      );
      const adminUserId = admin.rows[0]?.id;
      if (!adminUserId) {
        throw new InternalServerErrorException(
          "Company provisioning did not return an admin user id.",
        );
      }

      const roleAssignment = await tx.query(
        `INSERT INTO dbo.user_roles (user_id, role_id, company_id)
         SELECT @adminUserId, id, @companyId
         FROM dbo.roles
         WHERE code = N'tenant_admin'`,
        { adminUserId, companyId },
      );
      if ((roleAssignment.rowsAffected ?? 0) < 1) {
        throw new InternalServerErrorException(
          "Company provisioning could not assign tenant_admin role.",
        );
      }

      await this.audit.record(
        {
          actorUserId: actor.userId,
          eventType: "company_provisioned",
          targetType: "company",
          targetId: companyId,
          reason: "super_admin_provisioning",
          metadata: { adminUserId },
        },
        tx,
      );

      return {
        companyId,
        adminUserId,
        bootstrapAccessMode: "one_time_token",
        forceRotateOnFirstUse: true,
      };
    });
  }
}
