import {
  MiddlewareConsumer,
  Module,
  type INestApplication,
  type NestModule,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { generateKeyPair, SignJWT, type KeyLike } from "jose";
import { afterEach, describe, expect, it } from "vitest";
import type { AuthContext } from "@oc01/contracts";
import { AuditService } from "../src/audit/audit.service.js";
import { EnumerationProtectionService } from "../src/audit/enumeration-protection.service.js";
import { SessionVerificationKeyService } from "../src/auth/session-verification-key.service.js";
import { TokenValidatorService } from "../src/auth/token-validator.service.js";
import { CompaniesController } from "../src/companies/companies.controller.js";
import { CompaniesService } from "../src/companies/companies.service.js";
import { DatabaseService } from "../src/database/database.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";
import { RbacService } from "../src/rbac/rbac.service.js";
import { TenantAccessController } from "../src/tenant-access/tenant-access.controller.js";
import { TenantAccessService } from "../src/tenant-access/tenant-access.service.js";
import { TenantContextMiddleware } from "../src/tenant/tenant-context.middleware.js";
import { TenantContextService } from "../src/tenant/tenant-context.service.js";

class RecordingDatabase implements QueryExecutor {
  statements: Array<{ sql: string; parameters?: Record<string, unknown> }> = [];
  blocked = false;

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.statements.push({ sql, parameters });

    if (sql.includes("COUNT(1)")) {
      return { rows: [{ denied_count: 0 }] as T[] };
    }
    if (sql.includes("blocked_until >= SYSUTCDATETIME()")) {
      return {
        rows: this.blocked
          ? ([{ blocked_until: "2026-07-08T13:00:00.000Z" }] as T[])
          : [],
      };
    }
    if (sql.includes("INSERT INTO dbo.companies")) {
      return { rows: [{ id: "company-1" }] as T[] };
    }
    if (sql.includes("INSERT INTO dbo.users")) {
      return { rows: [{ id: "admin-1" }] as T[] };
    }
    if (sql.includes("INSERT INTO dbo.user_roles")) {
      return { rows: [], rowsAffected: 1 };
    }

    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }

  async applySessionContext(
    context: AuthContext,
    executor: QueryExecutor = this,
  ): Promise<void> {
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'company_id', @value = @companyId",
      { companyId: context.companyId ?? null },
    );
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'user_role', @value = @roleCode",
      {
        roleCode: context.isSuperAdmin
          ? "super_admin"
          : (context.roles[0] ?? null),
      },
    );
  }
}

class FixedSessionVerificationKeyService {
  constructor(private readonly publicKey: KeyLike | Uint8Array) {}

  async getKey(): Promise<KeyLike | Uint8Array> {
    return this.publicKey;
  }
}

async function signSessionToken(
  privateKey: KeyLike,
  claims: { sub: string; company_id?: string; roles: string[] },
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(claims.sub)
    .sign(privateKey);
}

const database = new RecordingDatabase();
let sessionKeyProvider: FixedSessionVerificationKeyService;

@Module({
  controllers: [TenantAccessController, CompaniesController],
  providers: [
    AuditService,
    CompaniesService,
    EnumerationProtectionService,
    RbacService,
    TokenValidatorService,
    TenantAccessService,
    TenantContextMiddleware,
    TenantContextService,
    { provide: DatabaseService, useValue: database },
    {
      provide: SessionVerificationKeyService,
      useFactory: () => sessionKeyProvider,
    },
  ],
})
class TestTenantAccessModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes("*");
  }
}

describe("Tenant access request path", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    database.blocked = false;
    database.statements = [];
  });

  it("ignores forged identity headers and requires a verified session token for super-admin provisioning", async () => {
    const { publicKey } = await generateKeyPair("RS256");
    sessionKeyProvider = new FixedSessionVerificationKeyService(publicKey);
    app = await NestFactory.create(TestTenantAccessModule, { logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address() as { port: number };

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/admin/companies`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-company-id": "tenant-a",
          "x-forwarded-for": "203.0.113.42",
          "x-user-id": "attacker",
          "x-user-roles": "super_admin",
        },
        body: JSON.stringify({
          companyName: "Acme",
          adminEmail: "admin@acme.test",
        }),
      },
    );

    expect(response.status).toBe(401);
    expect(
      database.statements.some((statement) =>
        statement.sql.includes("INSERT INTO dbo.companies"),
      ),
    ).toBe(false);
  });

  it("accepts valid signed sessions even when spoofed identity headers disagree", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    sessionKeyProvider = new FixedSessionVerificationKeyService(publicKey);
    app = await NestFactory.create(TestTenantAccessModule, { logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address() as { port: number };
    const token = await signSessionToken(privateKey, {
      sub: "sa",
      roles: ["super_admin"],
    });

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/admin/companies`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-company-id": "tenant-a",
          "x-user-id": "attacker",
          "x-user-roles": "reader",
        },
        body: JSON.stringify({
          companyName: "Acme",
          adminEmail: "admin@acme.test",
        }),
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(201);
    expect(body).toEqual({
      companyId: "company-1",
      adminUserId: "admin-1",
      bootstrapAccessMode: "one_time_token",
      forceRotateOnFirstUse: true,
    });

    const auditInsert = database.statements.find((statement) =>
      statement.sql.includes("INSERT INTO dbo.audit_events"),
    );
    expect(auditInsert?.parameters).toMatchObject({
      actorUserId: "sa",
    });
  });

  it("returns 403 without leaked tenant metadata and automatically records denial audit", async () => {
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    sessionKeyProvider = new FixedSessionVerificationKeyService(publicKey);
    app = await NestFactory.create(TestTenantAccessModule, { logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address() as { port: number };
    const token = await signSessionToken(privateKey, {
      sub: "admin-1",
      company_id: "tenant-a",
      roles: ["tenant_admin"],
    });

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/tenant/companies/tenant-b/admin-access`,
      {
        headers: {
          authorization: `Bearer ${token}`,
          "x-company-id": "tenant-a",
          "x-forwarded-for": "203.0.113.42",
          "x-user-id": "admin-1",
          "x-user-roles": "tenant_admin",
        },
      },
    );
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(403);
    expect(JSON.stringify(body)).not.toContain("tenant-b");
    expect(body).toMatchObject({
      error: "Forbidden",
      message: "Cross-tenant access is forbidden.",
      statusCode: 403,
    });

    const auditInsert = database.statements.find((statement) =>
      statement.sql.includes("INSERT INTO dbo.audit_events"),
    );
    expect(auditInsert?.parameters).toMatchObject({
      companyId: "tenant-a",
      actorUserId: "admin-1",
      eventType: "cross_tenant_denied",
      targetType: "company",
      targetId: "tenant-b",
      reason: "scope_mismatch",
      metadataJson: JSON.stringify({ attemptedPermission: "tenant:admin" }),
    });
    expect(auditInsert?.parameters?.sourceIp).not.toBe("203.0.113.42");
    expect(
      database.statements.some((statement) =>
        statement.sql.includes("COUNT(1)"),
      ),
    ).toBe(true);
  });
});
