import type { AuthContext } from "@oc01/contracts";
import { describe, expect, it } from "vitest";
import {
  DatabaseService,
  type QueryExecutor,
  type QueryResult,
} from "../src/database/database.service.js";

class RecordingExecutor implements QueryExecutor {
  calls: Array<{ sql: string; parameters?: Record<string, unknown> }> = [];

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.calls.push({ sql, parameters });
    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

class FakeTransactionDriver {
  calls: Array<{ sql: string; parameters?: Record<string, unknown> }> = [];
  committed = false;
  rolledBack = false;
  rollbackError?: Error;

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.calls.push({ sql, parameters });
    return { rows: [] };
  }

  async commit(): Promise<void> {
    this.committed = true;
  }

  async rollback(): Promise<void> {
    this.rolledBack = true;
    if (this.rollbackError) {
      throw this.rollbackError;
    }
  }
}

class FakeDriver {
  transaction = new FakeTransactionDriver();

  async query<T>(): Promise<QueryResult<T>> {
    return { rows: [] };
  }

  async beginTransaction(): Promise<FakeTransactionDriver> {
    return this.transaction;
  }
}

function expectSessionContextCleanup(
  calls: Array<{ sql: string; parameters?: Record<string, unknown> }>,
): void {
  expect(calls.at(-3)?.sql).toContain(
    "sp_set_session_context @key = N'company_id', @value = NULL",
  );
  expect(calls.at(-2)?.sql).toContain(
    "sp_set_session_context @key = N'user_role', @value = NULL",
  );
  expect(calls.at(-1)?.sql).toContain(
    "sp_set_session_context @key = N'global_principal_login', @value = NULL",
  );
}

describe("DatabaseService", () => {
  it("sets SQL Server session context from auth context", async () => {
    const database = new DatabaseService();
    const executor = new RecordingExecutor();
    const context: AuthContext = {
      userId: "u1",
      companyId: "c1",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
    };

    await database.applySessionContext(context, executor);

    expect(executor.calls).toHaveLength(2);
    expect(executor.calls[0]?.sql).toContain(
      "sp_set_session_context @key = N'company_id'",
    );
    expect(executor.calls[0]?.parameters).toEqual({ companyId: "c1" });
    expect(executor.calls[1]?.parameters).toEqual({ roleCode: "tenant_admin" });
  });

  it("commits transactions and clears session context on success", async () => {
    const driver = new FakeDriver();
    const database = new DatabaseService(driver as never);

    await database.transaction(async (tx) => {
      await database.applySessionContext(
        {
          userId: "u1",
          companyId: "c1",
          roles: ["tenant_admin"],
          isSuperAdmin: false,
        },
        tx,
      );
    });

    expect(driver.transaction.committed).toBe(true);
    expect(driver.transaction.rolledBack).toBe(false);
    expectSessionContextCleanup(driver.transaction.calls);
  });

  it("rolls back transactions and still clears session context on failure", async () => {
    const driver = new FakeDriver();
    const database = new DatabaseService(driver as never);

    await expect(
      database.transaction(async (tx) => {
        await database.applySessionContext(
          {
            userId: "u1",
            companyId: "c1",
            roles: ["tenant_admin"],
            isSuperAdmin: false,
          },
          tx,
        );
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(driver.transaction.committed).toBe(false);
    expect(driver.transaction.rolledBack).toBe(true);
    expectSessionContextCleanup(driver.transaction.calls);
  });

  it("preserves the original failure when rollback also fails", async () => {
    const driver = new FakeDriver();
    driver.transaction.rollbackError = new Error("rollback failed");
    const database = new DatabaseService(driver as never);

    await expect(
      database.transaction(async () => {
        throw new Error("business failed");
      }),
    ).rejects.toThrow("business failed");

    expect(driver.transaction.rolledBack).toBe(true);
  });
});
