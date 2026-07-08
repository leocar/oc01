import { computed, Injectable, signal } from "@angular/core";
import type { RoleCode } from "@oc01/contracts";

export interface AuthState {
  userId: string | null;
  companyId: string | null;
  roles: RoleCode[];
}

@Injectable({ providedIn: "root" })
export class AuthStore {
  private readonly state = signal<AuthState>({
    userId: null,
    companyId: null,
    roles: [],
  });

  readonly userId = computed(() => this.state().userId);
  readonly companyId = computed(() => this.state().companyId);
  readonly roles = computed(() => this.state().roles);
  readonly isAuthenticated = computed(() => this.userId() !== null);
  readonly isSuperAdmin = computed(() => this.roles().includes("super_admin"));
  readonly canProvisionTenants = computed(
    () => this.isAuthenticated() && this.isSuperAdmin(),
  );

  setState(next: AuthState): void {
    this.state.set(next);
  }
}
