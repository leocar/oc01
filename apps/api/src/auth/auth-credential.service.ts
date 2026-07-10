import { createHash, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { LoginRequest, LoginResponse, RoleCode } from "@oc01/contracts";
import { DatabaseService } from "../database/database.service.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password.";
const SHA256_PREFIX = "sha256:";

interface GlobalUserCredentialRow {
  user_id: string;
  password_hash: string | null;
  role_code: RoleCode;
}

@Injectable()
export class AuthCredentialService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async verify(request: LoginRequest): Promise<LoginResponse> {
    const rows = await this.findGlobalUserRows(request.username);
    const firstRow = rows[0];
    const roles = [...new Set(rows.map((row) => row.role_code))];

    if (
      !firstRow?.password_hash ||
      !roles.includes("super_admin") ||
      !this.verifyPassword(request.password, firstRow.password_hash)
    ) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      userId: firstRow.user_id,
      roles,
      isSuperAdmin: true,
    };
  }

  private async findGlobalUserRows(
    username: string,
  ): Promise<GlobalUserCredentialRow[]> {
    return this.database.transaction(async (tx) => {
      await tx.query(
        "EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = 1",
      );

      try {
        const result = await tx.query<GlobalUserCredentialRow>(
          `SELECT u.id AS user_id,
                  u.password_hash,
                  r.code AS role_code
           FROM dbo.users u
           INNER JOIN dbo.user_roles ur ON ur.user_id = u.id
           INNER JOIN dbo.roles r ON r.id = ur.role_id
           WHERE LOWER(u.email) = LOWER(@username)
             AND u.is_global_admin = 1
             AND u.password_hash IS NOT NULL
             AND u.force_credential_rotation = 0
             AND ur.company_id IS NULL
             AND r.scope = N'global'`,
          { username },
        );

        return result.rows;
      } finally {
        await tx.query(
          "EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = NULL",
        );
      }
    });
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash.startsWith(SHA256_PREFIX)) {
      return false;
    }

    const expected = storedHash.slice(SHA256_PREFIX.length);
    const actual = createHash("sha256").update(password, "utf8").digest("hex");

    return this.timingSafeEqual(actual, expected);
  }

  private timingSafeEqual(actualHex: string, expectedHex: string): boolean {
    if (actualHex.length !== expectedHex.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(actualHex), Buffer.from(expectedHex));
  }
}

export function createSha256PasswordHash(password: string): string {
  return `${SHA256_PREFIX}${createHash("sha256")
    .update(password, "utf8")
    .digest("hex")}`;
}
