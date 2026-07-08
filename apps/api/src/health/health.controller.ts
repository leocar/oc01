import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";

export interface HealthResponse {
  status: "ok";
}

@Controller("health")
export class HealthController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  @Get("live")
  live(): HealthResponse {
    return { status: "ok" };
  }

  @Get("ready")
  async ready(): Promise<HealthResponse> {
    try {
      await this.database.query("SELECT 1 AS ready");
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException("Database readiness check failed.");
    }
  }
}
