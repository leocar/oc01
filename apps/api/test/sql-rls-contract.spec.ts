import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaRoot = resolve(process.cwd(), "../../db/sqlserver/schema");

describe("SQL Server RLS contract", () => {
  it("uses company_id and not tenant_id as the isolation key", () => {
    const core = readFileSync(resolve(schemaRoot, "001_core.sql"), "utf8");
    const rls = readFileSync(resolve(schemaRoot, "002_rls.sql"), "utf8");

    expect(`${core}\n${rls}`).toContain("company_id");
    expect(`${core}\n${rls}`).not.toContain("tenant_id");
  });

  it("defines RLS predicate and policy using SESSION_CONTEXT company_id", () => {
    const rls = readFileSync(resolve(schemaRoot, "002_rls.sql"), "utf8");

    expect(rls).toContain("CREATE FUNCTION dbo.fn_tenant_predicate");
    expect(rls).toContain("SESSION_CONTEXT(N'company_id')");
    expect(rls).toContain("CREATE SECURITY POLICY dbo.TenantSecurityPolicy");
    expect(rls).toContain(
      "ADD FILTER PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.users",
    );
    expect(rls).toContain(
      "ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.users AFTER INSERT",
    );
  });
});
