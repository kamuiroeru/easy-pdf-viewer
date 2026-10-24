import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { createDirectoryRoutes } from "./directories.ts";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "directory-api-"));
  await mkdir(join(root, "資料 空白"));
  await writeFile(join(root, "book.pdf"), "");
  await writeFile(join(root, "ignore.txt"), "");
  await writeFile(join(root, "資料 空白", "100%.png"), "");
});
afterEach(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

function request(query = "") {
  return new Hono()
    .route("/api/directories", createDirectoryRoutes(root))
    .request(`/api/directories${query}`);
}

it.each(["", "?path="])("lists root entries for %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(await response.json()).toEqual({
    entries: [
      { name: "資料 空白", path: "資料 空白", kind: "directory" },
      { name: "book.pdf", path: "book.pdf", kind: "file", format: "pdf" },
    ],
  });
});

it("decodes a nested path once and returns relative unencoded paths", async () => {
  const response = await request(`?path=${encodeURIComponent("資料 空白")}`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    entries: [{ name: "100%.png", path: "資料 空白/100%.png", kind: "file", format: "png" }],
  });
  await mkdir(join(root, "%2e%2e"));
  expect(await (await request("?path=%252e%252e")).json()).toEqual({ entries: [] });
});

it.each([
  ["../escape", 403, "FORBIDDEN"],
  ["/absolute", 403, "FORBIDDEN"],
  ["bad\0path", 403, "FORBIDDEN"],
  ["missing", 404, "NOT_FOUND"],
  ["book.pdf", 400, "NOT_DIRECTORY"],
  ["book.pdf/child", 404, "NOT_FOUND"],
] as const)("handles %s without exposing filesystem paths", async (path, status, error) => {
  const response = await request(`?path=${encodeURIComponent(path)}`);
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error });
});

it("rejects repeated path parameters", async () => {
  const response = await request("?path=first&path=second");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "INVALID_PATH" });
});

it("rejects links outside the content root", async () => {
  await symlink(tmpdir(), join(root, "outside"));
  const response = await request("?path=outside");
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "FORBIDDEN" });
});

it("hides unexpected filesystem errors", async () => {
  const service = await import("@be/services/directoryListing.ts");
  vi.spyOn(service, "listDirectory").mockRejectedValue(new Error(`failure at ${root}`));
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "INTERNAL_ERROR" });
});
