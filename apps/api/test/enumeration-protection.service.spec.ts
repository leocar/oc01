import { describe, expect, it } from "vitest";
import { EnumerationProtectionService } from "../src/audit/enumeration-protection.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";

class FakeExecutor implements QueryExecutor {
  inserts = 0;
  selectedHistory = false;
  blocked = false;
  lastParameters?: Record<string, unknown>;

  constructor(private readonly deniedCount: number) {}

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.lastParameters = parameters;
    if (sql.includes("COUNT(1)")) {
      return { rows: [{ denied_count: this.deniedCount }] as T[] };
    }
    if (sql.includes("blocked_until >= SYSUTCDATETIME()")) {
      return {
        rows: this.blocked
          ? ([{ blocked_until: "2026-07-08T13:00:00.000Z" }] as T[])
          : [],
      };
    }
    if (sql.includes("FROM dbo.ip_protection_events")) {
      this.selectedHistory = true;
      return {
        rows: [
          {
            source_ip: "203.0.113.42",
            reason: "identifier_enumeration_threshold",
            denied_attempt_count: 5,
            window_seconds: 600,
            blocked_until: "2026-07-08T13:00:00.000Z",
          },
        ] as T[],
      };
    }
    this.inserts += 1;
    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

describe("EnumerationProtectionService", () => {
  it("does not trigger protection before threshold", async () => {
    const executor = new FakeExecutor(3);
    const service = new EnumerationProtectionService(executor as never);

    await expect(
      service.recordDeniedLookup("203.0.113.42", executor),
    ).resolves.toBe(false);
    expect(executor.inserts).toBe(0);
  });

  it("triggers temporary protection when denied lookup threshold is met", async () => {
    const executor = new FakeExecutor(4);
    const service = new EnumerationProtectionService(executor as never);

    await expect(
      service.recordDeniedLookup("203.0.113.42", executor),
    ).resolves.toBe(true);
    expect(executor.inserts).toBe(1);
  });

  it("returns reviewable protective response history", async () => {
    const executor = new FakeExecutor(0);
    const service = new EnumerationProtectionService(executor as never);

    await expect(
      service.listProtectionHistory("203.0.113.42", executor),
    ).resolves.toEqual([
      {
        sourceIp: "203.0.113.42",
        reason: "identifier_enumeration_threshold",
        deniedAttemptCount: 5,
        windowSeconds: 600,
        blockedUntil: "2026-07-08T13:00:00.000Z",
      },
    ]);
    expect(executor.selectedHistory).toBe(true);
  });

  it("detects active source IP blocks", async () => {
    const executor = new FakeExecutor(0);
    executor.blocked = true;
    const service = new EnumerationProtectionService(executor as never);

    await expect(service.isBlocked("203.0.113.42", executor)).resolves.toBe(
      true,
    );
  });

  it("falls back to safe defaults for invalid policy env values", async () => {
    const originalThreshold = process.env.ID_ENUMERATION_THRESHOLD;
    const originalWindow = process.env.ID_ENUMERATION_WINDOW_SECONDS;
    const originalBlock = process.env.ID_ENUMERATION_BLOCK_SECONDS;
    process.env.ID_ENUMERATION_THRESHOLD = "0";
    process.env.ID_ENUMERATION_WINDOW_SECONDS = "NaN";
    process.env.ID_ENUMERATION_BLOCK_SECONDS = "-1";

    try {
      const executor = new FakeExecutor(4);
      const service = new EnumerationProtectionService(executor as never);

      await expect(
        service.recordDeniedLookup("203.0.113.42", executor),
      ).resolves.toBe(true);
      expect(executor.lastParameters).toMatchObject({
        deniedAttemptCount: 5,
        windowSeconds: 600,
        blockSeconds: 900,
      });
    } finally {
      restoreEnv("ID_ENUMERATION_THRESHOLD", originalThreshold);
      restoreEnv("ID_ENUMERATION_WINDOW_SECONDS", originalWindow);
      restoreEnv("ID_ENUMERATION_BLOCK_SECONDS", originalBlock);
    }
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
