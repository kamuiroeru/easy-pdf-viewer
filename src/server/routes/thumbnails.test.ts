import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Hono } from "hono";
import { afterEach, beforeEach, expect, it } from "vite-plus/test";
import { listDirectory } from "@be/services/directoryListing.ts";
import { createThumbnailRoutes } from "./thumbnails.ts";

let root: string;
const body = new Uint8Array([255, 216, 255, 217]);
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "thumbnail-api-"));
  await mkdir(join(root, "資料 空白"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function request(query: string): Promise<Response> {
  return new Hono()
    .route("/api/thumbnails", createThumbnailRoutes(root))
    .request(`/api/thumbnails${query}`);
}

it.each(["pdf", "PDF"])(
  "maps a relative %s path to JPG and serves exact bytes",
  async (extension) => {
    const path = `資料 空白/日本語 100% + #?.${extension}`;
    await writeFile(join(root, path.replace(/\.pdf$/i, ".jpg")), body);
    const response = await request(`?path=${encodeURIComponent(path)}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-length")).toBe(String(body.length));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
  },
);

it.each(["", "?path=", "?path=a.jpg", "?path=a.pdf&path=b.pdf"])(
  "rejects invalid queries %s",
  async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: "INVALID_PATH", message: expect.any(String) },
    });
  },
);

it.each(["../outside.pdf", "..\\outside.pdf", "/absolute.pdf", "bad\0path.pdf"])(
  "rejects unsafe paths %s",
  async (path) => {
    const response = await request(`?path=${encodeURIComponent(path)}`);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    });
  },
);

it("returns 404 for a missing JPG", async () => {
  const response = await request("?path=missing.pdf");
  expect(response.status).toBe(404);
  expect(await response.json()).toMatchObject({
    error: { code: "NOT_FOUND", message: expect.any(String) },
  });
});

it("rejects outside links, unsupported targets and directories", async () => {
  await symlink(tmpdir(), join(root, "outside"));
  await writeFile(join(root, "private.txt"), "private");
  await symlink(join(root, "private.txt"), join(root, "alias.jpg"));
  await mkdir(join(root, "directory.jpg"));
  for (const path of ["outside/missing.pdf", "alias.pdf", "directory.pdf"]) {
    const response = await request(`?path=${encodeURIComponent(path)}`);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    });
  }
});

it("builds a thumbnail URL from a directory entry and decodes it once", async () => {
  const content = join(root, "content");
  await mkdir(content);
  await writeFile(join(content, "%2e%2e.pdf"), "pdf");
  await writeFile(join(root, "%2e%2e.jpg"), body);
  const [entry] = await listDirectory("", content);
  const response = await request(`?path=${encodeURIComponent(entry!.path)}`);
  expect(response.status).toBe(200);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
});
