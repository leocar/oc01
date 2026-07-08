import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const containerName = process.env.SQL_SMOKE_CONTAINER ?? "oc01-rls-smoke";
const password = process.env.MSSQL_SA_PASSWORD ?? "Oc01_sqlSmoke_2026!";
const image = process.env.MSSQL_IMAGE ?? "mcr.microsoft.com/mssql/server:2025-latest";
const retries = positiveInt(process.env.SQL_SMOKE_RETRIES, 45);
const delayMs = positiveInt(process.env.SQL_SMOKE_DELAY_MS, 2000);

await removeContainer(containerName);
try {
  await run("docker", [
    "run",
    "-d",
    "--name",
    containerName,
    "-e",
    "ACCEPT_EULA=Y",
    "-e",
    `MSSQL_SA_PASSWORD=${password}`,
    image,
  ]);

  await waitForSqlServer();
  await run("docker", ["cp", path.join(root, "db"), `${containerName}:/work/`]);
  await runSqlFile("rls-runtime-smoke.sql");
} finally {
  await removeContainer(containerName);
}

async function waitForSqlServer() {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const result = await runSqlQuery("SELECT 1", {
      reject: false,
      stdio: "ignore",
    });
    if (result.exitCode === 0) {
      return;
    }

    await sleep(delayMs);
  }

  throw new Error("SQL Server did not become ready before the smoke timeout.");
}

function runSqlQuery(query, options = {}) {
  return run(
    "docker",
    [
      "exec",
      containerName,
      "/opt/mssql-tools18/bin/sqlcmd",
      "-C",
      "-S",
      "localhost",
      "-U",
      "sa",
      "-P",
      password,
      "-Q",
      query,
    ],
    options,
  );
}

function runSqlFile(filePath) {
  return run("docker", [
    "exec",
    "-w",
    "/work/sqlserver/tests",
    containerName,
    "/opt/mssql-tools18/bin/sqlcmd",
    "-C",
    "-S",
    "localhost",
    "-U",
    "sa",
    "-P",
    password,
    "-d",
    "master",
    "-i",
    filePath,
  ]);
}

async function removeContainer(name) {
  await run("docker", ["rm", "-f", name], { reject: false, stdio: "ignore" });
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args, options = {}) {
  const reject = options.reject ?? true;
  const stdio = options.stdio ?? "inherit";

  return new Promise((resolve, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio,
    });

    child.on("error", rejectPromise);
    child.on("close", (exitCode) => {
      if (exitCode === 0 || !reject) {
        resolve({ exitCode: exitCode ?? 1 });
        return;
      }

      rejectPromise(
        new Error(`${command} ${args.join(" ")} exited with ${exitCode}`),
      );
    });
  });
}
