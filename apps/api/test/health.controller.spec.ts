import { Module, ServiceUnavailableException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { DatabaseService } from "../src/database/database.service.js";
import { HealthController } from "../src/health/health.controller.js";

const database = { query: vi.fn() };

@Module({
  controllers: [HealthController],
  providers: [{ provide: DatabaseService, useValue: database }],
})
class HealthControllerTestModule {}

describe("HealthController", () => {
  it("resolves readiness dependencies through the Nest container", async () => {
    database.query.mockResolvedValueOnce({ rows: [] });
    const app = await NestFactory.createApplicationContext(
      HealthControllerTestModule,
      { logger: false },
    );

    try {
      const controller = app.get(HealthController);

      await expect(controller.ready()).resolves.toEqual({ status: "ok" });
      expect(database.query).toHaveBeenCalledWith("SELECT 1 AS ready");
    } finally {
      await app.close();
    }
  });

  it("returns liveness without checking dependencies", () => {
    const database = { query: vi.fn() };
    const controller = new HealthController(database as never);

    expect(controller.live()).toEqual({ status: "ok" });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("returns readiness only after the database responds", async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const controller = new HealthController(database as never);

    await expect(controller.ready()).resolves.toEqual({ status: "ok" });
    expect(database.query).toHaveBeenCalledWith("SELECT 1 AS ready");
  });

  it("maps database readiness failures to service unavailable", async () => {
    const database = { query: vi.fn().mockRejectedValue(new Error("down")) };
    const controller = new HealthController(database as never);

    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
