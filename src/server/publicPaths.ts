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

const PUBLIC_PATH_ERROR_CODE = {
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
} as const;

type PublicPathErrorCode = (typeof PUBLIC_PATH_ERROR_CODE)[keyof typeof PUBLIC_PATH_ERROR_CODE];

export class PublicPathError extends Error {
  readonly code: PublicPathErrorCode;

  constructor(code: PublicPathErrorCode) {
    super(code);
    this.code = code;
    this.name = "PublicPathError";
  }
}

function isWithin(root: string, path: string): boolean {
  const suffix = relative(root, path);
  return suffix !== ".." && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix);
}

/** Resolves decoded filesystem paths; callers must decode URL paths before calling. */
export async function resolvePublicPath(root: string, path: string): Promise<string> {
  if (isAbsolute(path) || path.includes("\0") || path.split(/[\\/]/).includes("..")) {
    throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.FORBIDDEN);
  }

  try {
    const canonicalRoot = await realpath(root);
    if (!(await stat(canonicalRoot)).isDirectory()) {
      throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.NOT_FOUND);
    }
    const target = resolve(canonicalRoot, path);
    if (!isWithin(canonicalRoot, target)) {
      throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.FORBIDDEN);
    }

    // Check every ancestor, including links leading to a missing child.
    let current = canonicalRoot;
    for (const segment of relative(canonicalRoot, target).split(sep).filter(Boolean)) {
      current = await realpath(resolve(current, segment));
      if (!isWithin(canonicalRoot, current)) {
        throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.FORBIDDEN);
      }
    }
    return current;
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") {
        throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.NOT_FOUND);
      }
      if (error.code === "EACCES" || error.code === "EPERM" || error.code === "ELOOP") {
        throw new PublicPathError(PUBLIC_PATH_ERROR_CODE.FORBIDDEN);
      }
    }
    throw error;
  }
}

export const publicPaths = {
  content: (path: string): Promise<string> => resolvePublicPath(env.CONTENT_ROOT, path),
  thumbnail: (path: string): Promise<string> => resolvePublicPath(env.THUMBNAIL_ROOT, path),
};
