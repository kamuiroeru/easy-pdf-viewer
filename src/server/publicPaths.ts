import { opendir, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { env } from "./env.ts";

export async function validatePublicRoots(
  roots: Pick<typeof env, "CONTENT_ROOT" | "THUMBNAIL_ROOT"> = env,
): Promise<void> {
  for (const name of ["CONTENT_ROOT", "THUMBNAIL_ROOT"] as const) {
    const root = roots[name];
    try {
      const directory = await opendir(root);
      try {
        await directory.read();
      } finally {
        await directory.close();
      }
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`${name} のディレクトリを開けません (${root}): ${reason}`, { cause });
    }
  }
}

export class PublicPathError extends Error {
  readonly code: "NOT_FOUND" | "FORBIDDEN";

  constructor(code: "NOT_FOUND" | "FORBIDDEN") {
    super(code);
    this.code = code;
    this.name = "PublicPathError";
  }
}

function isWithin(root: string, path: string) {
  const suffix = relative(root, path);
  return suffix !== ".." && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix);
}

/** Resolves decoded filesystem paths; callers must decode URL paths before calling. */
export async function resolvePublicPath(root: string, path: string): Promise<string> {
  if (isAbsolute(path) || path.includes("\0") || path.split(/[\\/]/).includes("..")) {
    throw new PublicPathError("FORBIDDEN");
  }

  try {
    const canonicalRoot = await realpath(root);
    if (!(await stat(canonicalRoot)).isDirectory()) {
      throw new PublicPathError("NOT_FOUND");
    }
    const target = resolve(canonicalRoot, path);
    if (!isWithin(canonicalRoot, target)) {
      throw new PublicPathError("FORBIDDEN");
    }

    // Check every ancestor, including links leading to a missing child.
    let current = canonicalRoot;
    for (const segment of relative(canonicalRoot, target).split(sep).filter(Boolean)) {
      current = await realpath(resolve(current, segment));
      if (!isWithin(canonicalRoot, current)) {
        throw new PublicPathError("FORBIDDEN");
      }
    }
    return current;
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        throw new PublicPathError("NOT_FOUND");
      }
      if (error.code === "EACCES" || error.code === "EPERM" || error.code === "ELOOP") {
        throw new PublicPathError("FORBIDDEN");
      }
    }
    throw error;
  }
}
