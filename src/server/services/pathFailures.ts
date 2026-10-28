import { FAILURE } from "./failures.ts";
import { PublicPathError } from "./publicPaths.ts";

export type PathFailure =
  | typeof FAILURE.FORBIDDEN
  | typeof FAILURE.NOT_FOUND
  | typeof FAILURE.NOT_DIRECTORY;

export function pathFailure(error: unknown, target: "file" | "directory"): PathFailure {
  if (error instanceof PublicPathError) {
    return error.code === "FORBIDDEN" ? FAILURE.FORBIDDEN : FAILURE.NOT_FOUND;
  }
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  if (code === "ENOENT") return FAILURE.NOT_FOUND;
  if (code === "ENOTDIR") return target === "directory" ? FAILURE.NOT_DIRECTORY : FAILURE.NOT_FOUND;
  if (code === "EACCES" || code === "EPERM" || (code === "EISDIR" && target === "file"))
    return FAILURE.FORBIDDEN;
  throw error instanceof Error ? error : new Error("Unexpected failure", { cause: error });
}
