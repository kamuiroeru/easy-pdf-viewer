import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { resolvePublicPath } from "./publicPaths.ts";

let temporary: string;
let root: string;

beforeEach(async () => {
  temporary = await mkdtemp(join(tmpdir(), "public-paths-"));
  root = join(temporary, "content");
  await mkdir(join(root, "日本語 フォルダ"), { recursive: true });
  await writeFile(join(root, "日本語 フォルダ", "資料 1.pdf"), "pdf");
  await mkdir(join(temporary, "content-other"));
  await writeFile(join(temporary, "content-other", "secret.pdf"), "secret");
});

afterEach(async () => {
  await rm(temporary, { recursive: true, force: true });
});

describe("resolvePublicPath", () => {
  it("resolves root, directories and Japanese paths containing spaces", async () => {
    for (const path of ["", ".", "日本語 フォルダ", "日本語 フォルダ/資料 1.pdf"]) {
      expect(await resolvePublicPath(root, path)).toBe(await realpath(join(root, path)));
    }
  });

  it.each([
    "../content-other/secret.pdf",
    "日本語 フォルダ/../../secret",
    "a/../b",
    "/etc/passwd",
    "bad\0path",
  ])("rejects forbidden input %s", async (path) => {
    await expect(resolvePublicPath(root, path)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("distinguishes missing files, missing roots and non-directory ancestors", async () => {
    for (const [base, path] of [
      [root, "missing.pdf"],
      [join(temporary, "missing"), "file.pdf"],
      [root, "日本語 フォルダ/資料 1.pdf/child"],
    ] as const) {
      await expect(resolvePublicPath(base, path)).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
  });

  it("rejects outside file and directory symlinks, including missing children", async () => {
    await symlink(join(temporary, "content-other"), join(root, "outside"));
    await symlink(join(temporary, "content-other", "secret.pdf"), join(root, "file.pdf"));
    for (const path of ["outside", "outside/secret.pdf", "outside/missing.pdf", "file.pdf"]) {
      await expect(resolvePublicPath(root, path)).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  });

  it("allows links within the root and a symlink configured as the root", async () => {
    await symlink(join(root, "日本語 フォルダ"), join(root, "inside"));
    await symlink(root, join(temporary, "root-link"));
    const expected = await realpath(join(root, "日本語 フォルダ", "資料 1.pdf"));
    expect(await resolvePublicPath(root, "inside/資料 1.pdf")).toBe(expected);
    expect(await resolvePublicPath(join(temporary, "root-link"), "inside/資料 1.pdf")).toBe(
      expected,
    );
  });
});
