import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { BootstrapAccessService } from "../src/auth/bootstrap-access.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";

class BootstrapExecutor implements QueryExecutor {
  statements: Array<{ sql: string; parameters?: Record<string, unknown> }> = [];

  constructor(private readonly userId?: string) {}

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.statements.push({ sql, parameters });

    if (sql.includes("bootstrap_access_token_hash")) {
      return {
        rows: this.userId ? ([{ user_id: this.userId }] as T[]) : [],
      };
    }

    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

describe("BootstrapAccessService", () => {
  it("marks first bootstrap use and forces credential replacement before normal use", async () => {
    const executor = new BootstrapExecutor("admin-1");
    const service = new BootstrapAccessService(executor as never);

    await expect(service.completeFirstUse("token-hash")).resolves.toEqual({
      userId: "admin-1",
      requiresCredentialReplacement: true,
    });

    expect(executor.statements[0]?.parameters).toMatchObject({
      oneTimeTokenHash: "token-hash",
    });
    expect(executor.statements[1]?.sql).toContain(
      "bootstrap_access_used_at = SYSUTCDATETIME()",
    );
    expect(executor.statements[1]?.sql).toContain(
      "force_credential_rotation = 1",
    );
    expect(executor.statements[1]?.parameters).toMatchObject({
      userId: "admin-1",
    });
  });

  it("rejects already used or unknown bootstrap access", async () => {
    const service = new BootstrapAccessService(
      new BootstrapExecutor(undefined) as never,
    );

    await expect(service.completeFirstUse("used-token")).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
