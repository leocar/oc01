import {
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { describe, expect, it, vi } from "vitest";
import { CompaniesService } from "../src/companies/companies.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";

class FakeTransaction implements QueryExecutor {
  statements: string[] = [];
  roleAssignmentRowsAffected = 1;

  async query<T>(sql: string): Promise<QueryResult<T>> {
    this.statements.push(sql);
    if (sql.includes("INSERT INTO dbo.companies")) {
      return { rows: [{ id: "company-1" }] as T[] };
    }
    if (sql.includes("INSERT INTO dbo.users")) {
      return { rows: [{ id: "admin-1" }] as T[] };
    }
    if (sql.includes("INSERT INTO dbo.user_roles")) {
      return { rows: [], rowsAffected: this.roleAssignmentRowsAffected };
    }
    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

function serviceFor(context: AuthContext) {
  const tx = new FakeTransaction();
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const database = {
    applySessionContext: vi.fn().mockResolvedValue(undefined),
    transaction: (work: (executor: QueryExecutor) => Promise<unknown>) =>
      work(tx),
  };
  const tenantContext = { getRequired: () => context };

  return {
    tx,
    audit,
    database,
    service: new CompaniesService(
      audit as never,
      database as never,
      tenantContext as never,
    ),
  };
}

describe("CompaniesService", () => {
  it("rejects tenant-scoped callers from provisioning companies", async () => {
    const { service } = serviceFor({
      userId: "u1",
      companyId: "c1",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
    });

    await expect(
      service.createCompany({
        companyName: "Acme",
        adminEmail: "admin@acme.test",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("provisions company, initial admin, role assignment and audit atomically for super-admin", async () => {
    const { service, tx, audit, database } = serviceFor({
      userId: "sa",
      roles: ["super_admin"],
      isSuperAdmin: true,
    });

    await expect(
      service.createCompany({
        companyName: "Acme",
        adminEmail: "admin@acme.test",
      }),
    ).resolves.toEqual({
      companyId: "company-1",
      adminUserId: "admin-1",
      bootstrapAccessMode: "one_time_token",
      forceRotateOnFirstUse: true,
    });

    expect(database.applySessionContext).toHaveBeenCalledOnce();
    expect(tx.statements.join("\n")).toContain("INSERT INTO dbo.companies");
    expect(tx.statements.join("\n")).toContain("INSERT INTO dbo.users");
    expect(tx.statements.join("\n")).toContain("bootstrap_access_token_hash");
    expect(tx.statements.join("\n")).toContain("INSERT INTO dbo.user_roles");
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "company_provisioned" }),
      tx,
    );
  });

  it("fails provisioning when tenant_admin role assignment cannot be confirmed", async () => {
    const { service, tx } = serviceFor({
      userId: "sa",
      roles: ["super_admin"],
      isSuperAdmin: true,
    });
    tx.roleAssignmentRowsAffected = 0;

    await expect(
      service.createCompany({
        companyName: "Acme",
        adminEmail: "admin@acme.test",
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
