import { describe, expect, it } from "vitest";
import { AuthStore } from "../src/app/auth/auth.store.js";

describe("AuthStore", () => {
  it("defaults to an unauthenticated state", () => {
    const store = new AuthStore();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.canProvisionTenants()).toBe(false);
  });

  it("derives super-admin provisioning access from roles", () => {
    const store = new AuthStore();
    store.setState({ userId: "sa", companyId: null, roles: ["super_admin"] });

    expect(store.isAuthenticated()).toBe(true);
    expect(store.canProvisionTenants()).toBe(true);
  });

  it("applies successful login authority as authenticated state", () => {
    const store = new AuthStore();

    store.applyLoginAuthority({
      userId: "sa",
      roles: ["super_admin"],
      isSuperAdmin: true,
    });

    expect(store.userId()).toBe("sa");
    expect(store.isAuthenticated()).toBe(true);
    expect(store.canProvisionTenants()).toBe(true);
  });

  it("does not grant provisioning access to tenant reader", () => {
    const store = new AuthStore();
    store.setState({ userId: "u1", companyId: "c1", roles: ["reader"] });

    expect(store.canProvisionTenants()).toBe(false);
  });
});
