import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthStore } from "./auth.store.js";

export const tenantHttpInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const companyId = auth.companyId();

  if (!companyId) {
    return next(request);
  }

  return next(
    request.clone({
      headers: request.headers.set("X-Company-ID", companyId),
    }),
  );
};
