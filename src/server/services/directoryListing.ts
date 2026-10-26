import { readdir } from "node:fs/promises";
import { extname, posix } from "node:path";
import { env } from "@be/env.ts";
import { resolvePublicPath } from "@be/publicPaths.ts";
import { FILE_FORMAT, type DirectoryEntry, type FileFormat } from "@s/directory.ts";

const fileFormats = new Map<string, FileFormat>([
  [".pdf", FILE_FORMAT.PDF],
  [".gif", FILE_FORMAT.GIF],
  [".webm", FILE_FORMAT.WEBM],
  [".png", FILE_FORMAT.PNG],
  [".jpg", FILE_FORMAT.JPEG],
  [".jpeg", FILE_FORMAT.JPEG],
]);

export async function listDirectory(path = "", root = env.CONTENT_ROOT): Promise<DirectoryEntry[]> {
  const directory = await resolvePublicPath(root, path);
  const entries: DirectoryEntry[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const base = { name: entry.name, path: posix.join(path, entry.name) };
    if (entry.isDirectory()) {
      entries.push({ ...base, kind: "directory" });
    } else if (entry.isFile()) {
      const format = fileFormats.get(extname(entry.name).toLowerCase());
      if (format) entries.push({ ...base, kind: "file", format });
    }
  }
  return entries.sort((a, b) => {
    if ((a.kind === "directory") !== (b.kind === "directory")) {
      return a.kind === "directory" ? -1 : 1;
    }
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
}
