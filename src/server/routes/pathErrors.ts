import type { Context } from "hono";
import { API_ERROR } from "@be/apiErrors.ts";
import { PublicPathError } from "@be/services/publicPaths.ts";

export function pathErrorResponse(c: Context, error: unknown, target: "file" | "directory") {
  if (error instanceof PublicPathError) {
    return error.code === "FORBIDDEN" ? API_ERROR.forbidden(c) : API_ERROR.notFound(c);
  }
  const code = error instanceof Error && "code" in error ? error.code : undefined;
  if (code === "ENOENT") return API_ERROR.notFound(c);
  if (code === "ENOTDIR") {
    return target === "directory" ? API_ERROR.notDirectory(c) : API_ERROR.notFound(c);
  }
  if (code === "EACCES" || code === "EPERM" || (code === "EISDIR" && target === "file")) {
    return API_ERROR.forbidden(c);
  }
  return API_ERROR.internal(c);
}
