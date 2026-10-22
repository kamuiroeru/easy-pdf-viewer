import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { createServerApp } from "./application.ts";

describe("client and API hosting", () => {
  let clientRoot: string;

  beforeAll(async () => {
    clientRoot = await mkdtemp(join(tmpdir(), "easy-pdf-viewer-"));
    await mkdir(join(clientRoot, "assets"));
    await writeFile(join(clientRoot, "index.html"), "<!doctype html><h1>PDF Viewer</h1>");
    await writeFile(join(clientRoot, "assets", "app.js"), "console.log('client');");
  });

  afterAll(async () => {
    await rm(clientRoot, { recursive: true, force: true });
  });

  it("serves the client HTML at the root", async () => {
    const response = await createServerApp("prod", clientRoot).request("/");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("<h1>PDF Viewer</h1>");
  });

  it("serves client assets", async () => {
    const response = await createServerApp("prod", clientRoot).request("/assets/app.js");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("javascript");
    expect(await response.text()).toBe("console.log('client');");
  });

  it("serves the API alongside the client", async () => {
    const response = await createServerApp("prod", clientRoot).request("/api/hello");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Hello from Hono!" });
  });

  it("returns 404 for unknown API routes and missing assets", async () => {
    const website = createServerApp("prod", clientRoot);

    expect((await website.request("/api/unknown")).status).toBe(404);
    expect((await website.request("/assets/missing.js")).status).toBe(404);
  });

  it("serves only the API in dev", async () => {
    const server = createServerApp("dev", clientRoot);

    expect((await server.request("/")).status).toBe(404);
    expect((await server.request("/assets/app.js")).status).toBe(404);
    expect((await server.request("/api/hello")).status).toBe(200);
  });

  it.each([undefined, "dev", "invalid", ""])("treats APP_ENV=%s as dev", async (value) => {
    vi.stubEnv("APP_ENV", value);
    try {
      const server = createServerApp();

      expect((await server.request("/")).status).toBe(404);
      expect((await server.request("/api/hello")).status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
