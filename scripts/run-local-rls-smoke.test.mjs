import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertSafeDatabaseName,
  runLocalRlsSmoke,
  smokeDatabaseName,
} from "./run-local-rls-smoke.mjs";

const baseEnv = {
  SQLSERVER_HOST: "localhost",
  SQLSERVER_PASSWORD: "secret-password",
  SQLSERVER_USER: "sa",
};

const dockerEnv = {
  SQLCMD_MODE: "docker",
  SQLSERVER_PASSWORD: "secret-password",
  SQLSERVER_USER: "sa",
};

describe("run-local-rls-smoke", () => {
  it("fails clearly when SQLSERVER_PASSWORD is missing", async () => {
    await assert.rejects(
      runLocalRlsSmoke({ env: {} }, async () => {}),
      /SQLSERVER_PASSWORD is required/,
    );
  });

  it("rejects system database names for SQL_SMOKE_DATABASE", () => {
    for (const databaseName of ["master", "model", "msdb", "tempdb"]) {
      assert.throws(
        () => assertSafeDatabaseName(databaseName),
        /cannot be a SQL Server system database/,
      );
    }
  });

  it("uses a generated disposable database and runs create, file, then drop", async () => {
    const calls = [];
    const result = await runLocalRlsSmoke(
      { env: baseEnv, now: () => 12345 },
      recordingRunner(calls),
    );

    assert.equal(result.smokeDatabase, "oc01_rls_smoke_12345");
    assert.notEqual(result.smokeDatabase, "master");
    assert.equal(calls.length, 3);
    assert.match(argAfter(calls[0].args, "-Q"), /CREATE DATABASE \[oc01_rls_smoke_12345\]/);
    assert.equal(argAfter(calls[1].args, "-d"), "oc01_rls_smoke_12345");
    assert.equal(argAfter(calls[1].args, "-i"), "rls-runtime-smoke.sql");
    assert.match(argAfter(calls[2].args, "-Q"), /DROP DATABASE \[oc01_rls_smoke_12345\]/);
  });

  it("does not pass the password as -P and sets SQLCMDPASSWORD in child env", async () => {
    const calls = [];
    await runLocalRlsSmoke(
      { env: baseEnv, now: () => 12345 },
      recordingRunner(calls),
    );

    for (const call of calls) {
      assert.equal(call.args.includes("-P"), false);
      assert.equal(call.options.env.SQLCMDPASSWORD, "secret-password");
      assert.equal(call.args.includes("secret-password"), false);
    }
  });

  it("builds docker sqlcmd client commands without exposing the password", async () => {
    const calls = [];
    await runLocalRlsSmoke(
      { env: dockerEnv, now: () => 12345 },
      recordingRunner(calls),
    );

    assert.equal(calls.length, 3);

    for (const call of calls) {
      assert.equal(call.command, "docker");
      assert.equal(call.args[0], "run");
      assert.equal(call.args.includes("--rm"), true);
      assert.equal(call.args.includes("/opt/mssql-tools18/bin/sqlcmd"), true);
      assert.equal(call.args[call.args.indexOf("SQLCMDPASSWORD") - 1], "-e");
      assert.equal(argAfter(call.args, "-w"), "/work/db/sqlserver/tests");
      assert.match(argAfter(call.args, "-v"), /db:\/work\/db:ro$/);
      assert.equal(argAfter(call.args, "-S"), "tcp:host.docker.internal,1433");
      assert.equal(call.args.includes("-P"), false);
      assert.equal(call.args.includes("secret-password"), false);
      assert.equal(call.options.env.SQLCMDPASSWORD, "secret-password");
    }
  });

  it("uses the default SQL Server image in docker mode and allows host and image overrides", async () => {
    const calls = [];
    await runLocalRlsSmoke(
      {
        env: {
          ...dockerEnv,
          SQLCMD_DOCKER_IMAGE: "example/sqlcmd-client:latest",
          SQLSERVER_HOST: "sql.example.test",
        },
        now: () => 12345,
      },
      recordingRunner(calls),
    );

    assert.equal(calls[0].args.includes("example/sqlcmd-client:latest"), true);
    assert.equal(argAfter(calls[0].args, "-S"), "tcp:sql.example.test,1433");

    const defaultImageCalls = [];
    await runLocalRlsSmoke(
      { env: dockerEnv, now: () => 12345 },
      recordingRunner(defaultImageCalls),
    );

    assert.equal(
      defaultImageCalls[0].args.includes("mcr.microsoft.com/mssql/server:2025-latest"),
      true,
    );
  });

  it("runs cleanup after the smoke file fails", async () => {
    const calls = [];
    await assert.rejects(
      runLocalRlsSmoke({ env: baseEnv, now: () => 12345 }, async (command, args, options) => {
        calls.push({ args, command, options });
        if (args.includes("-i")) {
          throw new Error("smoke failed");
        }
      }),
      /smoke failed/,
    );

    assert.equal(calls.length, 3);
    assert.match(argAfter(calls[2].args, "-Q"), /DROP DATABASE \[oc01_rls_smoke_12345\]/);
  });

  it("keeps the database and logs the database name when requested", async () => {
    const calls = [];
    const logs = [];
    const result = await runLocalRlsSmoke(
      {
        env: { ...baseEnv, SQL_SMOKE_KEEP_DATABASE: "true" },
        logger: { log: (message) => logs.push(message) },
        now: () => 12345,
      },
      recordingRunner(calls),
    );

    assert.equal(result.kept, true);
    assert.equal(calls.length, 2);
    assert.equal(logs.length, 1);
    assert.match(logs[0], /oc01_rls_smoke_12345/);
  });
});

assert.equal(smokeDatabaseName(undefined, () => 12345), "oc01_rls_smoke_12345");

function recordingRunner(calls) {
  return async (command, args, options) => {
    calls.push({ args, command, options });
  };
}

function argAfter(args, flag) {
  return args[args.indexOf(flag) + 1];
}
