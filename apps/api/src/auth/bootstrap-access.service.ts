import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import {
  DatabaseService,
  type QueryExecutor,
} from "../database/database.service.js";

export interface BootstrapFirstUseResult {
  userId: string;
  requiresCredentialReplacement: true;
}

@Injectable()
export class BootstrapAccessService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async completeFirstUse(
    oneTimeTokenHash: string,
  ): Promise<BootstrapFirstUseResult> {
    return this.database.transaction(async (tx) => {
      const bootstrap = await this.findUnusedBootstrapAccess(
        oneTimeTokenHash,
        tx,
      );
      if (!bootstrap) {
        throw new UnauthorizedException("Invalid bootstrap access.");
      }

      await tx.query(
        `UPDATE dbo.users
         SET bootstrap_access_used_at = SYSUTCDATETIME(),
             force_credential_rotation = 1
         WHERE id = @userId`,
        { userId: bootstrap.userId },
      );

      return {
        userId: bootstrap.userId,
        requiresCredentialReplacement: true,
      };
    });
  }

  private async findUnusedBootstrapAccess(
    oneTimeTokenHash: string,
    executor: QueryExecutor,
  ): Promise<{ userId: string } | undefined> {
    const result = await executor.query<{ user_id: string }>(
      `SELECT TOP (1) id AS user_id
       FROM dbo.users
       WHERE bootstrap_access_token_hash = @oneTimeTokenHash
         AND bootstrap_access_used_at IS NULL`,
      { oneTimeTokenHash },
    );

    const row = result.rows[0];
    return row ? { userId: row.user_id } : undefined;
  }
}
