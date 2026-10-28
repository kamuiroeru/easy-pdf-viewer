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

function request(query: string, headers?: Record<string, string>) {
  return new Hono()
    .route("/api/files", createFileRoutes(root))
    .request(`/api/files${query}`, { headers });
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
  expect(await response.json()).toMatchObject({
    error: { code: error, message: expect.any(String) },
  });
});

it.each(["", "?path=", "?path=a.pdf&path=b.pdf"])("rejects invalid queries: %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { code: "INVALID_PATH", message: expect.any(String) },
  });
});

it("rejects outside symlinks and aliases to unsupported files", async () => {
  await symlink(tmpdir(), join(root, "outside"));
  await symlink(join(root, "ignore.txt"), join(root, "alias.pdf"));
  for (const path of ["outside/secret.pdf", "alias.pdf"]) {
    const response = await request(`?path=${encodeURIComponent(path)}`);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    });
  }
});

it("decodes paths only once", async () => {
  await writeFile(join(root, "%2e%2e.pdf"), body);
  const response = await request("?path=%252e%252e.pdf");
  expect(response.status).toBe(200);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
});

it.each([
  ["bytes=0-1", 0, 1],
  ["bytes=1-3", 1, 3],
  ["bytes=3-", 3, 4],
  ["bytes=-2", 3, 4],
  ["bytes=2-99", 2, 4],
  ["bytes=-99", 0, 4],
  ["bytes=0-99999999999999999999999", 0, 4],
  ["bytes=-99999999999999999999999", 0, 4],
  ["BYTES=0-0", 0, 0],
])("serves a single range %s", async (range, start, end) => {
  await writeFile(join(root, "sample.webm"), body);
  const response = await request("?path=sample.webm", { Range: range });
  expect(response.status).toBe(206);
  expect(response.headers.get("accept-ranges")).toBe("bytes");
  expect(response.headers.get("content-type")).toBe("video/webm");
  expect(response.headers.get("content-range")).toBe(`bytes ${start}-${end}/5`);
  expect(response.headers.get("content-length")).toBe(String(end - start + 1));
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body.slice(start, end + 1));
});

it.each(["bytes=5-", "bytes=99-100", "bytes=-0", "bytes=99999999999999999999999-"])(
  "rejects an unsatisfiable range %s",
  async (range) => {
    await writeFile(join(root, "sample.pdf"), body);
    const response = await request("?path=sample.pdf", { Range: range });
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */5");
    expect(response.headers.get("content-length")).toBe("0");
    expect(await response.text()).toBe("");
  },
);

it.each(["bytes=3-1", "bytes=-", "bytes=abc-def", "items=0-1", "bytes=0-1,3-4", "bytes=1.5-2"])(
  "ignores unsupported or malformed range %s",
  async (range) => {
    await writeFile(join(root, "sample.pdf"), body);
    const response = await request("?path=sample.pdf", { Range: range });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-range")).toBeNull();
    expect(response.headers.get("content-length")).toBe("5");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
  },
);

it("returns the full file for If-Range without a matching validator", async () => {
  await writeFile(join(root, "sample.pdf"), body);
  const response = await request("?path=sample.pdf", { Range: "bytes=0-1", "If-Range": '"old"' });
  expect(response.status).toBe(200);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
});

it.each([undefined, "bytes=0-", "bytes=-1"])("handles empty files with range %s", async (range) => {
  await writeFile(join(root, "empty.pdf"), "");
  const response = await request("?path=empty.pdf", range ? { Range: range } : undefined);
  expect(response.status).toBe(range ? 416 : 200);
  expect(response.headers.get("content-range")).toBe(range ? "bytes */0" : null);
  expect(response.headers.get("content-length")).toBe("0");
  expect(await response.text()).toBe("");
});
