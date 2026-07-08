import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testsDir = path.join(root, "db", "sqlserver", "tests");

if (isCliEntryPoint()) {
  await main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}

async function main() {
  await runLocalRlsSmoke();
}

export async function runLocalRlsSmoke(config = {}, runner = spawnRunner) {
  const env = config.env ?? process.env;
  const sqlcmdPath = env.SQLCMD_PATH ?? "sqlcmd";
  const host = env.SQLSERVER_HOST ?? "localhost";
  const port = env.SQLSERVER_PORT ?? "1433";
  const user = env.SQLSERVER_USER ?? "sa";
  const password = env.SQLSERVER_PASSWORD;
  const adminDatabase = env.SQLSERVER_DATABASE ?? "master";
  const keepDatabase = env.SQL_SMOKE_KEEP_DATABASE === "true";
  const logger = config.logger ?? console;
  const cwd = config.cwd ?? testsDir;

  if (!password) {
    throw new Error(
      "SQLSERVER_PASSWORD is required to run the local SQL Server RLS smoke.",
    );
  }

  const smokeDatabase = smokeDatabaseName(env.SQL_SMOKE_DATABASE, config.now);
  let created = false;
  let primaryError;

  try {
    await runSqlQuery(runner, {
      adminDatabase,
      cwd,
      env,
      host,
      password,
      port,
      query: createDatabaseSql(smokeDatabase),
      sqlcmdPath,
      user,
    });
    created = true;
    await runSqlFile(runner, {
      cwd,
      database: smokeDatabase,
      env,
      filePath: "rls-runtime-smoke.sql",
      host,
      password,
      port,
      sqlcmdPath,
      user,
    });
  } catch (error) {
    primaryError = error;
  } finally {
    if (created && !keepDatabase) {
      try {
        await runSqlQuery(runner, {
          adminDatabase,
          cwd,
          env,
          host,
          password,
          port,
          query: dropDatabaseSql(smokeDatabase),
          sqlcmdPath,
          user,
        });
      } catch (cleanupError) {
        if (primaryError instanceof Error) {
          primaryError.message += ` Cleanup also failed: ${errorMessage(cleanupError)}`;
        } else {
          primaryError = cleanupError;
        }
      }
    }
  }

  if (primaryError) {
    throw primaryError;
  }

  if (keepDatabase) {
    logger.log(`SQL smoke database kept: ${smokeDatabase}`);
  }

  return { kept: keepDatabase, smokeDatabase };
}

function runSqlQuery(runner, options) {
  return runner(
    options.sqlcmdPath,
    sqlcmdArgs(options, options.adminDatabase, ["-Q", options.query]),
    sqlcmdOptions(options),
  );
}

function runSqlFile(runner, options) {
  return runner(
    options.sqlcmdPath,
    sqlcmdArgs(options, options.database, ["-i", options.filePath]),
    sqlcmdOptions(options),
  );
}

function sqlcmdArgs(options, database, args) {
  return [
    "-C",
    "-b",
    "-S",
    serverName(options.host, options.port),
    "-U",
    options.user,
    "-d",
    database,
    ...args,
  ];
}

function sqlcmdOptions(options) {
  return {
    cwd: options.cwd,
    env: {
      ...options.env,
      SQLCMDPASSWORD: options.password,
    },
    stdio: "inherit",
  };
}

export function smokeDatabaseName(value, now = Date.now) {
  const databaseName = value?.trim() || `oc01_rls_smoke_${now()}`;
  assertSafeDatabaseName(databaseName);
  return databaseName;
}

export function assertSafeDatabaseName(databaseName) {
  if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(databaseName)) {
    throw new Error(
      "SQL_SMOKE_DATABASE must contain only letters, numbers, and underscores, start with a letter, and be at most 128 characters.",
    );
  }

  if (["master", "model", "msdb", "tempdb"].includes(databaseName.toLowerCase())) {
    throw new Error(
      "SQL_SMOKE_DATABASE cannot be a SQL Server system database.",
    );
  }
}

function createDatabaseSql(databaseName) {
  return `
IF DB_ID(N'${sqlString(databaseName)}') IS NOT NULL
  THROW 51010, 'SQL smoke database already exists.', 1;
CREATE DATABASE ${sqlIdentifier(databaseName)};
`;
}

function dropDatabaseSql(databaseName) {
  return `
IF DB_ID(N'${sqlString(databaseName)}') IS NOT NULL
BEGIN
  ALTER DATABASE ${sqlIdentifier(databaseName)} SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE ${sqlIdentifier(databaseName)};
END;
`;
}

function sqlIdentifier(value) {
  return `[${value.replaceAll("]", "]]")}]`;
}

function sqlString(value) {
  return value.replaceAll("'", "''");
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function serverName(hostName, portNumber) {
  const normalizedPort = portNumber?.trim();
  if (!normalizedPort) {
    return hostName;
  }

  return `tcp:${hostName},${normalizedPort}`;
}

function spawnRunner(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} exited with ${exitCode}`,
        ),
      );
    });
  });
}

function isCliEntryPoint() {
  return process.argv[1]
    ? import.meta.url === pathToFileURL(process.argv[1]).href
    : false;
}
