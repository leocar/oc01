import { ForbiddenException } from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { describe, expect, it } from "vitest";
import { RbacService } from "../src/rbac/rbac.service.js";

describe("RbacService", () => {
  const service = new RbacService();

  it("allows editor writes inside own company", () => {
    const context: AuthContext = {
      userId: "u1",
      companyId: "c1",
      roles: ["editor"],
      isSuperAdmin: false,
    };
    expect(() =>
      service.assertTenantPermission(context, "c1", "record:write"),
    ).not.toThrow();
  });

  it("allows tenant admins to perform tenant administration inside own company", () => {
    const context: AuthContext = {
      userId: "admin-1",
      companyId: "c1",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
    };

    expect(() =>
      service.assertTenantPermission(context, "c1", "tenant:admin"),
    ).not.toThrow();
  });

  it("denies reader writes inside own company", () => {
    const context: AuthContext = {
      userId: "u1",
      companyId: "c1",
      roles: ["reader"],
      isSuperAdmin: false,
    };
    expect(() =>
      service.assertTenantPermission(context, "c1", "record:write"),
    ).toThrow(ForbiddenException);
  });

  it("denies cross-tenant access for tenant roles", () => {
    const context: AuthContext = {
      userId: "u1",
      companyId: "c1",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
    };
    expect(() =>
      service.assertTenantPermission(context, "c2", "tenant:admin"),
    ).toThrow(ForbiddenException);
  });

  it("allows explicit super-admin authority", () => {
    const context: AuthContext = {
      userId: "sa",
      roles: ["super_admin"],
      isSuperAdmin: true,
    };
    expect(() =>
      service.assertTenantPermission(context, "c2", "tenant:admin"),
    ).not.toThrow();
  });
});
