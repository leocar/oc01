import { Module } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { exportPKCS8, generateKeyPair, jwtVerify } from "jose";
import { afterEach, describe, expect, it } from "vitest";
import { AuthController } from "../src/auth/auth.controller.js";
import {
  createSha256PasswordHash,
  AuthCredentialService,
} from "../src/auth/auth-credential.service.js";
import { SessionTokenIssuerService } from "../src/auth/session-token-issuer.service.js";
import { DatabaseService } from "../src/database/database.service.js";
import type {
  QueryExecutor,
  QueryResult,
} from "../src/database/database.service.js";

const VALID_PASSWORD = "super-user";
const INVALID_PASSWORD = "other";

class LoginDatabase implements QueryExecutor {
  readonly statements: Array<{
    sql: string;
    parameters?: Record<string, unknown>;
  }> = [];

  constructor(private readonly passwordHash?: string) {}

  async query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>> {
    this.statements.push({ sql, parameters });

    if (parameters?.username === "sa" && this.passwordHash) {
      return {
        rows: [
          {
            user_id: "user-1",
            password_hash: this.passwordHash,
            role_code: "super_admin",
          },
        ] as T[],
      };
    }

    return { rows: [] };
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return work(this);
  }
}

let database: LoginDatabase;

@Module({
  controllers: [AuthController],
  providers: [
    AuthCredentialService,
    SessionTokenIssuerService,
    { provide: DatabaseService, useFactory: () => database },
  ],
})
class AuthLoginTestModule {}

describe("POST /api/auth/login", () => {
  let app: INestApplication | undefined;
  const previousPrivateKey = process.env.AUTH_SESSION_PRIVATE_KEY;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    if (previousPrivateKey === undefined) {
      delete process.env.AUTH_SESSION_PRIVATE_KEY;
    } else {
      process.env.AUTH_SESSION_PRIVATE_KEY = previousPrivateKey;
    }
  });

  it("authenticates the super-user and issues a hardened session cookie", async () => {
    const password = runtimePassword();
    database = new LoginDatabase(createSha256PasswordHash(password));
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(privateKey);
    app = await NestFactory.create(AuthLoginTestModule, { logger: false });
    await app.listen(0);

    const response = await fetch(`${baseUrl(app)}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "sa", password }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      userId: "user-1",
      roles: ["super_admin"],
      isSuperAdmin: true,
    });
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Path=/");

    const token = setCookie?.match(/session=([^;]+)/)?.[1];
    expect(token).toBeDefined();
    await expect(jwtVerify(token ?? "", publicKey)).resolves.toMatchObject({
      payload: { sub: "user-1", roles: ["super_admin"] },
    });
    expect(database.statements.map((statement) => statement.sql)).toEqual(
      expect.arrayContaining([
        "EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = 1",
        "EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = NULL",
      ]),
    );
  });

  it("rejects invalid login without establishing a session", async () => {
    database = new LoginDatabase(createSha256PasswordHash(runtimePassword()));
    const { privateKey } = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(privateKey);
    app = await NestFactory.create(AuthLoginTestModule, { logger: false });
    await app.listen(0);

    const response = await fetch(`${baseUrl(app)}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "sa",
        password: runtimeOtherPassword(),
      }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns the same generic error for unknown users and bad passwords", async () => {
    database = new LoginDatabase(createSha256PasswordHash(runtimePassword()));
    const { privateKey } = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(privateKey);
    app = await NestFactory.create(AuthLoginTestModule, { logger: false });
    await app.listen(0);

    const badPassword = await postLogin(app, {
      username: "sa",
      password: runtimeOtherPassword(),
    });
    const unknownUser = await postLogin(app, {
      username: "missing",
      password: runtimePassword(),
    });

    expect(badPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    await expect(badPassword.json()).resolves.toMatchObject({
      message: "Invalid username or password.",
    });
    await expect(unknownUser.json()).resolves.toMatchObject({
      message: "Invalid username or password.",
    });
  });

  it.each([
    ["missing username", { password: runtimePassword() }],
    ["missing password", { username: "sa" }],
    ["non-string username", { username: 42, password: runtimePassword() }],
    ["non-string password", { username: "sa", password: 42 }],
  ])("rejects malformed login payloads: %s", async (_name, body) => {
    database = new LoginDatabase(createSha256PasswordHash(runtimePassword()));
    const { privateKey } = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(privateKey);
    app = await NestFactory.create(AuthLoginTestModule, { logger: false });
    await app.listen(0);

    const response = await postLogin(app, body);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Username and password are required.",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(database.statements).toEqual([]);
  });
});

async function postLogin(
  app: INestApplication,
  body: unknown,
): Promise<Response> {
  return fetch(`${baseUrl(app)}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function baseUrl(app: INestApplication): string {
  const address = app.getHttpServer().address() as { port: number };
  return `http://127.0.0.1:${address.port}`;
}

function runtimePassword(): string {
  return VALID_PASSWORD;
}

function runtimeOtherPassword(): string {
  return INVALID_PASSWORD;
}
