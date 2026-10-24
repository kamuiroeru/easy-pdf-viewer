import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vite-plus/test";
import { listDirectory } from "./directoryListing.ts";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "directory-listing-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

it("returns all immediate folders and supported files in deterministic order", async () => {
  for (const name of ["z-folder", "A-folder", "資料 空白"]) {
    await mkdir(join(root, name));
  }
  const files = ["z.JpEg", "b.gif", "c.WEBM", "d.png", "e.jpg", "A.PDF", "f.jpeg"];
  for (const name of [...files, "ignore.txt", "fake.pdf.txt", ".pdf", "no-extension"]) {
    await writeFile(join(root, name), "");
  }
  await writeFile(join(root, "z-folder", "nested.pdf"), "");
  expect(await listDirectory("", root)).toEqual([
    ...["A-folder", "z-folder", "資料 空白"].map((name) => ({
      name,
      path: name,
      kind: "directory",
    })),
    ...[
      ["A.PDF", "pdf"],
      ["b.gif", "gif"],
      ["c.WEBM", "webm"],
      ["d.png", "png"],
      ["e.jpg", "jpeg"],
      ["f.jpeg", "jpeg"],
      ["z.JpEg", "jpeg"],
    ].map(([name, format]) => ({ name, path: name, kind: "file", format })),
  ]);
});

it("returns root-relative unencoded paths and an empty list for empty directories", async () => {
  await mkdir(join(root, "資料 空白"));
  expect(await listDirectory("資料 空白", root)).toEqual([]);
  await writeFile(join(root, "資料 空白", "100%.pdf"), "");
  expect(await listDirectory("./資料 空白/", root)).toEqual([
    { name: "100%.pdf", path: "資料 空白/100%.pdf", kind: "file", format: "pdf" },
  ]);
});

it("omits symbolic links, including broken links and links outside the root", async () => {
  await mkdir(join(root, "folder"));
  await writeFile(join(root, "file.pdf"), "");
  await symlink(join(root, "file.pdf"), join(root, "link.pdf"));
  await symlink(join(root, "folder"), join(root, "linked-folder"));
  await symlink(join(root, "missing"), join(root, "broken.pdf"));
  await symlink(tmpdir(), join(root, "outside"));
  expect((await listDirectory("", root)).map((entry) => entry.name)).toEqual([
    "folder",
    "file.pdf",
  ]);
  await writeFile(join(root, "folder", "inside.pdf"), "");
  expect(await listDirectory("linked-folder", root)).toEqual([
    { name: "inside.pdf", path: "linked-folder/inside.pdf", kind: "file", format: "pdf" },
  ]);
  await expect(listDirectory("outside", root)).rejects.toMatchObject({ code: "FORBIDDEN" });
});

it("propagates errors for forbidden, missing and non-directory paths", async () => {
  await writeFile(join(root, "file.pdf"), "");
  await expect(listDirectory("../escape", root)).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(listDirectory("missing", root)).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(listDirectory("file.pdf", root)).rejects.toMatchObject({ code: "ENOTDIR" });
});
