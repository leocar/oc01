import { Inject, Injectable, Optional } from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import sql from "mssql";

export interface QueryResult<T> {
  rows: T[];
  rowsAffected?: number;
}

export interface QueryExecutor {
  query<T>(
    sql: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>>;
  transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T>;
}

interface SqlDriver {
  query<T>(
    sqlText: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>>;
  beginTransaction(): Promise<SqlTransactionDriver>;
}

interface SqlTransactionDriver {
  query<T>(
    sqlText: string,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export const SQL_DRIVER = Symbol("SQL_DRIVER");

@Injectable()
export class DatabaseService implements QueryExecutor {
  private driver?: SqlDriver;

  constructor(
    @Optional()
    @Inject(SQL_DRIVER)
    private readonly injectedDriver?: SqlDriver,
  ) {}

  async query<T>(
    sqlText: string,
    parameters: Record<string, unknown> = {},
  ): Promise<QueryResult<T>> {
    return this.getDriver().query<T>(sqlText, parameters);
  }

  async transaction<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    const transaction = await this.getDriver().beginTransaction();
    const executor: QueryExecutor = {
      query: <TResult>(sqlText: string, parameters?: Record<string, unknown>) =>
        transaction.query<TResult>(sqlText, parameters),
      transaction: async <TResult>(
        nestedWork: (tx: QueryExecutor) => Promise<TResult>,
      ) => nestedWork(executor),
    };

    try {
      const result = await work(executor);
      await this.clearSessionContext(executor);
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await this.clearSessionContext(executor);
      } catch {
        // Preserve the original failure while still attempting rollback.
      }
      try {
        await transaction.rollback();
      } catch {
        // Preserve the original failure instead of masking it with rollback noise.
      }
      throw error;
    }
  }

  async applySessionContext(
    context: AuthContext,
    executor: QueryExecutor = this,
  ): Promise<void> {
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'company_id', @value = @companyId",
      {
        companyId: context.companyId ?? null,
      },
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

  async clearSessionContext(executor: QueryExecutor = this): Promise<void> {
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'company_id', @value = NULL",
    );
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'user_role', @value = NULL",
    );
    await executor.query(
      "EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = NULL",
    );
  }

  private getDriver(): SqlDriver {
    if (!this.driver) {
      this.driver = this.injectedDriver ?? new MssqlDriver();
    }

    return this.driver;
  }
}

class MssqlDriver implements SqlDriver {
  private poolPromise?: Promise<sql.ConnectionPool>;

  async query<T>(
    sqlText: string,
    parameters: Record<string, unknown> = {},
  ): Promise<QueryResult<T>> {
    const pool = await this.getPool();
    const request = pool.request();
    bindParameters(request, parameters);
    const result = await request.query<T>(sqlText);
    return normalizeResult(result);
  }

  async beginTransaction(): Promise<SqlTransactionDriver> {
    const pool = await this.getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    return {
      query: async <T>(
        sqlText: string,
        parameters: Record<string, unknown> = {},
      ): Promise<QueryResult<T>> => {
        const request = new sql.Request(transaction);
        bindParameters(request, parameters);
        const result = await request.query<T>(sqlText);
        return normalizeResult(result);
      },
      commit: async () => {
        await transaction.commit();
      },
      rollback: async () => {
        await transaction.rollback();
      },
    };
  }

  private async getPool(): Promise<sql.ConnectionPool> {
    if (!this.poolPromise) {
      this.poolPromise = this.connect().catch((error: unknown) => {
        this.poolPromise = undefined;
        throw error;
      });
    }

    return this.poolPromise;
  }

  private async connect(): Promise<sql.ConnectionPool> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for SQL Server access.");
    }

    const pool = new sql.ConnectionPool(connectionString);
    return pool.connect();
  }
}

function bindParameters(
  request: sql.Request,
  parameters: Record<string, unknown>,
): void {
  for (const [name, value] of Object.entries(parameters)) {
    request.input(name, value ?? null);
  }
}

function normalizeResult<T>(result: sql.IResult<T>): QueryResult<T> {
  return {
    rows: result.recordset ?? [],
    rowsAffected: result.rowsAffected.reduce(
      (sum: number, value: number) => sum + value,
      0,
    ),
  };
}
