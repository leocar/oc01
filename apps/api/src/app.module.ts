import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CompaniesModule } from "./companies/companies.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { RbacModule } from "./rbac/rbac.module.js";
import { TenantAccessModule } from "./tenant-access/tenant-access.module.js";
import { TenantModule } from "./tenant/tenant.module.js";
import { TenantContextMiddleware } from "./tenant/tenant-context.middleware.js";

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    AuditModule,
    AuthModule,
    HealthModule,
    RbacModule,
    CompaniesModule,
    TenantAccessModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes("*");
  }
}
