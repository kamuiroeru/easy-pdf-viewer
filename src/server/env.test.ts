import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("server environment", () => {
  it.each(["CONTENT_ROOT", "THUMBNAIL_ROOT"])("rejects unset %s", async (key) => {
    vi.stubEnv(key, undefined);
    await expect(import("./env.ts")).rejects.toThrow(key);
  });

  it("accepts configured public roots containing Japanese and spaces", async () => {
    vi.stubEnv("CONTENT_ROOT", "/tmp/公開 資料");
    vi.stubEnv("THUMBNAIL_ROOT", "./サムネイル 画像");
    const { env } = await import("./env.ts");
    expect(env.CONTENT_ROOT).toBe("/tmp/公開 資料");
    expect(env.THUMBNAIL_ROOT).toBe("./サムネイル 画像");
  });

  it.each(["CONTENT_ROOT", "THUMBNAIL_ROOT"])("rejects empty %s", async (key) => {
    vi.stubEnv(key, "");
    await expect(import("./env.ts")).rejects.toThrow(key);
  });

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
