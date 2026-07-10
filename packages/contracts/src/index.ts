export type TenantRole = "tenant_admin" | "editor" | "reader";
export type GlobalRole = "super_admin";
export type RoleCode = GlobalRole | TenantRole;

export type BootstrapAccessMode =
  "temporary_password" | "invite_link" | "one_time_token";

export interface AuthContext {
  userId: string;
  companyId?: string;
  roles: RoleCode[];
  isSuperAdmin: boolean;
  sourceIp?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  roles: RoleCode[];
  isSuperAdmin: boolean;
}

export interface CreateCompanyRequest {
  companyName: string;
  adminEmail: string;
}

export interface CreateCompanyResponse {
  companyId: string;
  adminUserId: string;
  bootstrapAccessMode: BootstrapAccessMode;
  forceRotateOnFirstUse: true;
}

export interface AuditEventInput {
  companyId?: string;
  actorUserId?: string;
  sourceIp?: string;
  eventType: string;
  targetType?: string;
  targetId?: string;
  reason: string;
  metadata?: Record<string, unknown>;
}
