import { Inject, Injectable } from "@nestjs/common";
import {
  DatabaseService,
  type QueryExecutor,
} from "../database/database.service.js";

export interface EnumerationPolicy {
  threshold: number;
  windowSeconds: number;
  blockSeconds: number;
}

export interface ProtectionHistoryEntry {
  sourceIp: string;
  reason: string;
  deniedAttemptCount: number;
  windowSeconds: number;
  blockedUntil: Date | string;
}

export interface ActiveProtectionEntry {
  blockedUntil: Date | string;
}

const DEFAULT_POLICY: EnumerationPolicy = {
  threshold: 5,
  windowSeconds: 600,
  blockSeconds: 900,
};

@Injectable()
export class EnumerationProtectionService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async recordDeniedLookup(
    sourceIp: string,
    executor: QueryExecutor = this.database,
  ): Promise<boolean> {
    const policy = this.policyFromEnv();
    const result = await executor.query<{ denied_count: number }>(
      `SELECT COUNT(1) AS denied_count
       FROM dbo.audit_events
       WHERE source_ip = @sourceIp
         AND event_type = N'cross_tenant_denied'
         AND created_at >= DATEADD(SECOND, -@windowSeconds, SYSUTCDATETIME())`,
      { sourceIp, windowSeconds: policy.windowSeconds },
    );

    const deniedCount = result.rows[0]?.denied_count ?? 0;
    if (deniedCount + 1 < policy.threshold) {
      return false;
    }

    await executor.query(
      `INSERT INTO dbo.ip_protection_events
       (source_ip, reason, denied_attempt_count, window_seconds, blocked_until)
       VALUES (@sourceIp, @reason, @deniedAttemptCount, @windowSeconds, DATEADD(SECOND, @blockSeconds, SYSUTCDATETIME()))`,
      {
        sourceIp,
        reason: "identifier_enumeration_threshold",
        deniedAttemptCount: deniedCount + 1,
        windowSeconds: policy.windowSeconds,
        blockSeconds: policy.blockSeconds,
      },
    );

    return true;
  }

  async isBlocked(
    sourceIp: string,
    executor: QueryExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.query<ActiveProtectionEntry>(
      `SELECT TOP (1) blocked_until
       FROM dbo.ip_protection_events
       WHERE source_ip = @sourceIp
         AND blocked_until >= SYSUTCDATETIME()
       ORDER BY blocked_until DESC`,
      { sourceIp },
    );

    return result.rows.length > 0;
  }

  async listProtectionHistory(
    sourceIp: string,
    executor: QueryExecutor = this.database,
  ): Promise<ProtectionHistoryEntry[]> {
    const result = await executor.query<{
      source_ip: string;
      reason: string;
      denied_attempt_count: number;
      window_seconds: number;
      blocked_until: Date | string;
    }>(
      `SELECT TOP (50)
         source_ip,
         reason,
         denied_attempt_count,
         window_seconds,
         blocked_until
       FROM dbo.ip_protection_events
       WHERE source_ip = @sourceIp
       ORDER BY blocked_until DESC`,
      { sourceIp },
    );

    return result.rows.map((row) => ({
      sourceIp: row.source_ip,
      reason: row.reason,
      deniedAttemptCount: row.denied_attempt_count,
      windowSeconds: row.window_seconds,
      blockedUntil: row.blocked_until,
    }));
  }

  private policyFromEnv(): EnumerationPolicy {
    return {
      threshold: positiveIntegerFromEnv(
        process.env.ID_ENUMERATION_THRESHOLD,
        DEFAULT_POLICY.threshold,
      ),
      windowSeconds: positiveIntegerFromEnv(
        process.env.ID_ENUMERATION_WINDOW_SECONDS,
        DEFAULT_POLICY.windowSeconds,
      ),
      blockSeconds: positiveIntegerFromEnv(
        process.env.ID_ENUMERATION_BLOCK_SECONDS,
        DEFAULT_POLICY.blockSeconds,
      ),
    };
  }
}

function positiveIntegerFromEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
