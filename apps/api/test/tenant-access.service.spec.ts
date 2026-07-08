import { ForbiddenException, HttpStatus } from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { describe, expect, it, vi } from "vitest";
import { TenantAccessService } from "../src/tenant-access/tenant-access.service.js";

describe("TenantAccessService", () => {
  it("actively blocks callers with an active enumeration protection record", async () => {
    const actor: AuthContext = {
      userId: "admin-1",
      companyId: "tenant-a",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
      sourceIp: "203.0.113.42",
    };

    const service = new TenantAccessService(
      { record: vi.fn() } as never,
      {
        isBlocked: vi.fn().mockResolvedValue(true),
        recordDeniedLookup: vi.fn(),
      } as never,
      { assertTenantPermission: vi.fn() } as never,
      { getRequired: () => actor } as never,
    );

    await expect(
      service.getTenantAdminAccess("tenant-a"),
    ).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it("preserves forbidden denial when audit persistence fails", async () => {
    const actor: AuthContext = {
      userId: "admin-1",
      companyId: "tenant-a",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
      sourceIp: "203.0.113.42",
    };
    const recordDeniedLookup = vi.fn().mockResolvedValue(false);
    const service = new TenantAccessService(
      { record: vi.fn().mockRejectedValue(new Error("audit down")) } as never,
      {
        isBlocked: vi.fn().mockResolvedValue(false),
        recordDeniedLookup,
      } as never,
      {
        assertTenantPermission: vi.fn(() => {
          throw new ForbiddenException("Cross-tenant access is forbidden.");
        }),
      } as never,
      { getRequired: () => actor } as never,
    );

    await expect(service.getTenantAdminAccess("tenant-b")).rejects.toThrow(
      ForbiddenException,
    );
    expect(recordDeniedLookup).toHaveBeenCalledWith("203.0.113.42");
  });

  it("preserves forbidden denial when enumeration persistence fails", async () => {
    const actor: AuthContext = {
      userId: "admin-1",
      companyId: "tenant-a",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
      sourceIp: "203.0.113.42",
    };
    const service = new TenantAccessService(
      { record: vi.fn().mockResolvedValue(undefined) } as never,
      {
        isBlocked: vi.fn().mockResolvedValue(false),
        recordDeniedLookup: vi
          .fn()
          .mockRejectedValue(new Error("counter down")),
      } as never,
      {
        assertTenantPermission: vi.fn(() => {
          throw new ForbiddenException("Cross-tenant access is forbidden.");
        }),
      } as never,
      { getRequired: () => actor } as never,
    );

    await expect(service.getTenantAdminAccess("tenant-b")).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("does not block authorized access when the block lookup is unavailable", async () => {
    const actor: AuthContext = {
      userId: "admin-1",
      companyId: "tenant-a",
      roles: ["tenant_admin"],
      isSuperAdmin: false,
      sourceIp: "203.0.113.42",
    };
    const service = new TenantAccessService(
      { record: vi.fn() } as never,
      {
        isBlocked: vi.fn().mockRejectedValue(new Error("lookup down")),
        recordDeniedLookup: vi.fn(),
      } as never,
      { assertTenantPermission: vi.fn() } as never,
      { getRequired: () => actor } as never,
    );

    await expect(service.getTenantAdminAccess("tenant-a")).resolves.toEqual({
      companyId: "tenant-a",
      access: "granted",
    });
  });
});
