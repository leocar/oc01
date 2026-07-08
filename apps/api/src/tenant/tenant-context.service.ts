import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthContext } from "@oc01/contracts";
import { AsyncLocalStorage } from "node:async_hooks";

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<AuthContext>();

  run<T>(context: AuthContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getOptional(): AuthContext | undefined {
    return this.storage.getStore();
  }

  getRequired(): AuthContext {
    const context = this.storage.getStore();
    if (!context) {
      throw new UnauthorizedException("Missing request tenant context.");
    }
    return context;
  }
}
