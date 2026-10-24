import { readdir } from "node:fs/promises";
import { extname, posix } from "node:path";
import { env } from "@be/env.ts";
import { resolvePublicPath } from "@be/publicPaths.ts";
import type { DirectoryEntry, DirectoryEntryKind } from "@s/directory.ts";

const fileKinds = new Map<string, DirectoryEntryKind>([
  [".pdf", "pdf"],
  [".gif", "gif"],
  [".webm", "webm"],
  [".png", "png"],
  [".jpg", "jpeg"],
  [".jpeg", "jpeg"],
]);

export async function listDirectory(path = "", root = env.CONTENT_ROOT): Promise<DirectoryEntry[]> {
  const directory = await resolvePublicPath(root, path);
  const entries: DirectoryEntry[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const kind = entry.isDirectory()
      ? "directory"
      : entry.isFile()
        ? fileKinds.get(extname(entry.name).toLowerCase())
        : undefined;
    if (kind) {
      entries.push({ name: entry.name, path: posix.join(path, entry.name), kind });
    }
  }
  return entries.sort((a, b) => {
    if ((a.kind === "directory") !== (b.kind === "directory")) {
      return a.kind === "directory" ? -1 : 1;
    }
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}
