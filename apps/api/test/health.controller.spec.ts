import { Module, ServiceUnavailableException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { exportPKCS8, exportSPKI, generateKeyPair } from "jose";
import { describe, expect, it, vi } from "vitest";
import { SessionTokenIssuerService } from "../src/auth/session-token-issuer.service.js";
import { SessionVerificationKeyService } from "../src/auth/session-verification-key.service.js";
import { DatabaseService } from "../src/database/database.service.js";
import { HealthController } from "../src/health/health.controller.js";

const database = { query: vi.fn() };
const sessionTokens = { assertReady: vi.fn(), assertCompatibleWith: vi.fn() };
const sessionVerificationKeys = { getKey: vi.fn() };

@Module({
  controllers: [HealthController],
  providers: [
    { provide: DatabaseService, useValue: database },
    { provide: SessionTokenIssuerService, useValue: sessionTokens },
    {
      provide: SessionVerificationKeyService,
      useValue: sessionVerificationKeys,
    },
  ],
})
class HealthControllerTestModule {}

describe("HealthController", () => {
  it("resolves readiness dependencies through the Nest container", async () => {
    database.query.mockResolvedValueOnce({ rows: [] });
    sessionTokens.assertReady.mockResolvedValueOnce(undefined);
    sessionTokens.assertCompatibleWith.mockResolvedValueOnce(undefined);
    const verificationKey = {};
    sessionVerificationKeys.getKey.mockResolvedValueOnce(verificationKey);
    const app = await NestFactory.createApplicationContext(
      HealthControllerTestModule,
      { logger: false },
    );

    try {
      const controller = app.get(HealthController);

      await expect(controller.ready()).resolves.toEqual({ status: "ok" });
      expect(database.query).toHaveBeenCalledWith("SELECT 1 AS ready");
      expect(sessionTokens.assertReady).toHaveBeenCalled();
      expect(sessionVerificationKeys.getKey).toHaveBeenCalled();
      expect(sessionTokens.assertCompatibleWith).toHaveBeenCalledWith(
        verificationKey,
      );
    } finally {
      await app.close();
    }
  });

  it("returns liveness without checking dependencies", () => {
    const database = { query: vi.fn() };
    const sessionTokens = {
      assertReady: vi.fn(),
      assertCompatibleWith: vi.fn(),
    };
    const sessionVerificationKeys = { getKey: vi.fn() };
    const controller = new HealthController(
      database as never,
      sessionTokens as never,
      sessionVerificationKeys as never,
    );

    expect(controller.live()).toEqual({ status: "ok" });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("returns readiness only after the database responds", async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const verificationKey = {};
    const sessionTokens = {
      assertReady: vi.fn().mockResolvedValue(undefined),
      assertCompatibleWith: vi.fn().mockResolvedValue(undefined),
    };
    const sessionVerificationKeys = {
      getKey: vi.fn().mockResolvedValue(verificationKey),
    };
    const controller = new HealthController(
      database as never,
      sessionTokens as never,
      sessionVerificationKeys as never,
    );

    await expect(controller.ready()).resolves.toEqual({ status: "ok" });
    expect(database.query).toHaveBeenCalledWith("SELECT 1 AS ready");
    expect(sessionTokens.assertReady).toHaveBeenCalled();
    expect(sessionVerificationKeys.getKey).toHaveBeenCalled();
    expect(sessionTokens.assertCompatibleWith).toHaveBeenCalledWith(
      verificationKey,
    );
  });

  it("maps database readiness failures to service unavailable", async () => {
    const database = { query: vi.fn().mockRejectedValue(new Error("down")) };
    const sessionTokens = {
      assertReady: vi.fn(),
      assertCompatibleWith: vi.fn(),
    };
    const sessionVerificationKeys = { getKey: vi.fn() };
    const controller = new HealthController(
      database as never,
      sessionTokens as never,
      sessionVerificationKeys as never,
    );

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(sessionTokens.assertReady).not.toHaveBeenCalled();
    expect(sessionVerificationKeys.getKey).not.toHaveBeenCalled();
    expect(sessionTokens.assertCompatibleWith).not.toHaveBeenCalled();
  });

  it("maps session signing key readiness failures to service unavailable", async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const sessionTokens = {
      assertReady: vi.fn().mockRejectedValue(new Error("missing key")),
      assertCompatibleWith: vi.fn(),
    };
    const sessionVerificationKeys = { getKey: vi.fn() };
    const controller = new HealthController(
      database as never,
      sessionTokens as never,
      sessionVerificationKeys as never,
    );

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(sessionVerificationKeys.getKey).not.toHaveBeenCalled();
    expect(sessionTokens.assertCompatibleWith).not.toHaveBeenCalled();
  });

  it("maps session verification key readiness failures to service unavailable", async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const sessionTokens = {
      assertReady: vi.fn().mockResolvedValue(undefined),
      assertCompatibleWith: vi.fn(),
    };
    const sessionVerificationKeys = {
      getKey: vi.fn().mockRejectedValue(new Error("missing verification key")),
    };
    const controller = new HealthController(
      database as never,
      sessionTokens as never,
      sessionVerificationKeys as never,
    );

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(sessionTokens.assertCompatibleWith).not.toHaveBeenCalled();
  });

  it("maps mismatched session signing and verification keys to service unavailable", async () => {
    const previousPrivateKey = process.env.AUTH_SESSION_PRIVATE_KEY;
    const previousPublicKey = process.env.AUTH_SESSION_PUBLIC_KEY;
    const signingPair = await generateKeyPair("RS256");
    const verificationPair = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(
      signingPair.privateKey,
    );
    process.env.AUTH_SESSION_PUBLIC_KEY = await exportSPKI(
      verificationPair.publicKey,
    );
    const controller = new HealthController(
      { query: vi.fn().mockResolvedValue({ rows: [] }) } as never,
      new SessionTokenIssuerService(),
      new SessionVerificationKeyService(),
    );

    try {
      await expect(controller.ready()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    } finally {
      restoreAuthKeyEnv(previousPrivateKey, previousPublicKey);
    }
  });

  it("passes readiness when session signing and verification keys match", async () => {
    const previousPrivateKey = process.env.AUTH_SESSION_PRIVATE_KEY;
    const previousPublicKey = process.env.AUTH_SESSION_PUBLIC_KEY;
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    process.env.AUTH_SESSION_PRIVATE_KEY = await exportPKCS8(privateKey);
    process.env.AUTH_SESSION_PUBLIC_KEY = await exportSPKI(publicKey);
    const controller = new HealthController(
      { query: vi.fn().mockResolvedValue({ rows: [] }) } as never,
      new SessionTokenIssuerService(),
      new SessionVerificationKeyService(),
    );

    try {
      await expect(controller.ready()).resolves.toEqual({ status: "ok" });
    } finally {
      restoreAuthKeyEnv(previousPrivateKey, previousPublicKey);
    }
  });
});

function restoreAuthKeyEnv(
  privateKey: string | undefined,
  publicKey: string | undefined,
): void {
  if (privateKey === undefined) {
    delete process.env.AUTH_SESSION_PRIVATE_KEY;
  } else {
    process.env.AUTH_SESSION_PRIVATE_KEY = privateKey;
  }

  if (publicKey === undefined) {
    delete process.env.AUTH_SESSION_PUBLIC_KEY;
  } else {
    process.env.AUTH_SESSION_PUBLIC_KEY = publicKey;
  }
}
