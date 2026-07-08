import { Routes } from "@angular/router";
import { tenantAdminGuard } from "./auth/tenant-admin.guard.js";
import { AdminShellComponent } from "./shell/admin-shell.component.js";

export const routes: Routes = [
  {
    path: "",
    canActivate: [tenantAdminGuard],
    component: AdminShellComponent,
  },
  {
    path: "login",
    loadComponent: () =>
      import("./auth/login.component.js").then((m) => m.LoginComponent),
  },
  { path: "**", redirectTo: "" },
];
