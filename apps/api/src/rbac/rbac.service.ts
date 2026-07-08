import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthContext, TenantRole } from "@oc01/contracts";

export type Permission =
  "tenant:admin" | "record:read" | "record:write" | "record:delete";

const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  tenant_admin: [
    "tenant:admin",
    "record:read",
    "record:write",
    "record:delete",
  ],
  editor: ["record:read", "record:write"],
  reader: ["record:read"],
};

@Injectable()
export class RbacService {
  assertTenantPermission(
    context: AuthContext,
    companyId: string,
    permission: Permission,
  ): void {
    if (context.isSuperAdmin) {
      return;
    }
    if (!context.companyId || context.companyId !== companyId) {
      throw new ForbiddenException("Cross-tenant access is forbidden.");
    }

    const allowed = context.roles.some((role) => {
      if (role === "super_admin") {
        return true;
      }
      return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
    });

    if (!allowed) {
      throw new ForbiddenException("Insufficient tenant role permission.");
    }
  }
}
