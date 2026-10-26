import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { afterEach, beforeEach, expect, it } from "vite-plus/test";
import { createFileRoutes } from "./files.ts";

let root: string;
const body = new Uint8Array([0, 1, 127, 128, 255]);
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "file-api-"));
  await mkdir(join(root, "資料 空白"));
  await mkdir(join(root, "directory.pdf"));
  await writeFile(join(root, "ignore.txt"), "private");
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function request(query: string) {
  return new Hono().route("/api/files", createFileRoutes(root)).request(`/api/files${query}`);
}

it.each([
  ["pdf", "application/pdf"],
  ["gif", "image/gif"],
  ["webm", "video/webm"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["PDF", "application/pdf"],
])("serves %s files with their exact bytes and MIME type", async (extension, contentType) => {
  const path = `資料 空白/日本語 100% + #?.${extension}`;
  await writeFile(join(root, path), body);
  const response = await request(`?path=${encodeURIComponent(path)}`);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(contentType);
  expect(response.headers.get("content-length")).toBe(String(body.length));
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
});

it.each([
  ["../outside.pdf", 403, "FORBIDDEN"],
  ["..\\outside.pdf", 403, "FORBIDDEN"],
  ["/absolute.pdf", 403, "FORBIDDEN"],
  ["bad\0path.pdf", 403, "FORBIDDEN"],
  ["ignore.txt", 403, "FORBIDDEN"],
  ["directory.pdf", 403, "FORBIDDEN"],
  ["資料 空白", 403, "FORBIDDEN"],
  [".", 403, "FORBIDDEN"],
  ["missing.pdf", 404, "NOT_FOUND"],
  ["ignore.txt/child.pdf", 404, "NOT_FOUND"],
] as const)("rejects %s", async (path, status, error) => {
  const response = await request(`?path=${encodeURIComponent(path)}`);
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error });
});

it.each(["", "?path=", "?path=a.pdf&path=b.pdf"])("rejects invalid queries: %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "INVALID_PATH" });
});

it("rejects outside symlinks and aliases to unsupported files", async () => {
  await symlink(tmpdir(), join(root, "outside"));
  await symlink(join(root, "ignore.txt"), join(root, "alias.pdf"));
  for (const path of ["outside/secret.pdf", "alias.pdf"]) {
    const response = await request(`?path=${encodeURIComponent(path)}`);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
  }
});

it("decodes paths only once", async () => {
  await writeFile(join(root, "%2e%2e.pdf"), body);
  const response = await request("?path=%252e%252e.pdf");
  expect(response.status).toBe(200);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
});
