import { Inject, Injectable } from "@nestjs/common";
import type { AuditEventInput } from "@oc01/contracts";
import {
  DatabaseService,
  type QueryExecutor,
} from "../database/database.service.js";

@Injectable()
export class AuditService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async record(
    event: AuditEventInput,
    executor: QueryExecutor = this.database,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO dbo.audit_events
       (company_id, actor_user_id, source_ip, event_type, target_type, target_id, reason, metadata_json)
       VALUES (@companyId, @actorUserId, @sourceIp, @eventType, @targetType, @targetId, @reason, @metadataJson)`,
      {
        companyId: event.companyId ?? null,
        actorUserId: event.actorUserId ?? null,
        sourceIp: event.sourceIp ?? null,
        eventType: event.eventType,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        reason: event.reason,
        metadataJson: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    );
  }
}
