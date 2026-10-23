import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("server environment", () => {
  it("defaults APP_ENV to dev when unset", async () => {
    vi.stubEnv("APP_ENV", undefined);

    const { env } = await import("./env.ts");

    expect(env.APP_ENV).toBe("dev");
  });

  it.each(["dev", "prod"])("accepts APP_ENV=%s", async (value) => {
    vi.stubEnv("APP_ENV", value);

    const { env } = await import("./env.ts");

    expect(env.APP_ENV).toBe(value);
  });

  it.each(["invalid", "", "production"])("rejects APP_ENV=%s on import", async (value) => {
    vi.stubEnv("APP_ENV", value);

    await expect(import("./env.ts")).rejects.toThrow("APP_ENV");
  });
});
