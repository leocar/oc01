import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { HealthController } from "../src/health/health.controller.js";

describe("HealthController", () => {
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
