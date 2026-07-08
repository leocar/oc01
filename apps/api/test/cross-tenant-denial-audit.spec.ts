import { ForbiddenException } from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { describe, expect, it } from "vitest";
import { AuditService } from "../src/audit/audit.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";
import { RbacService } from "../src/rbac/rbac.service.js";

class RecordingExecutor implements QueryExecutor {
  statements: Array<{ sql: string; parameters?: Record<string, unknown> }> = [];

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.statements.push({ sql, parameters });
    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

describe("cross-tenant denial audit evidence", () => {
  it("records actor, target scope, and denial reason when RBAC rejects cross-tenant access", async () => {
    const actor: AuthContext = {
      userId: "admin-1",
      companyId: "tenant-a",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
    };
    const rbac = new RbacService();
    const executor = new RecordingExecutor();
    const audit = new AuditService(executor as never);

    expect(() =>
      rbac.assertTenantPermission(actor, "tenant-b", "tenant:admin"),
    ).toThrow(ForbiddenException);

    await audit.record(
      {
        companyId: actor.companyId,
        actorUserId: actor.userId,
        sourceIp: "203.0.113.42",
        eventType: "cross_tenant_denied",
        targetType: "company",
        targetId: "tenant-b",
        reason: "scope_mismatch",
        metadata: { attemptedPermission: "tenant:admin" },
      },
      executor,
    );

    expect(executor.statements).toHaveLength(1);
    expect(executor.statements[0]?.sql).toContain(
      "INSERT INTO dbo.audit_events",
    );
    expect(executor.statements[0]?.parameters).toMatchObject({
      companyId: "tenant-a",
      actorUserId: "admin-1",
      sourceIp: "203.0.113.42",
      eventType: "cross_tenant_denied",
      targetType: "company",
      targetId: "tenant-b",
      reason: "scope_mismatch",
      metadataJson: JSON.stringify({ attemptedPermission: "tenant:admin" }),
    });
  });
});
