import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_ERROR } from "@be/apiErrors.ts";
import { PublicPathError } from "@be/publicPaths.ts";
import { listDirectory } from "@be/services/directoryListing.ts";

/** GET /?path=<URL-encoded relative path>; omitted or empty path selects the root. */
export function createDirectoryRoutes(root?: string) {
  return new Hono().get(
    "/",
    validator("query", (query, c) => {
      if (Array.isArray(query.path)) {
        return API_ERROR.invalidPath(c);
      }
      return { path: query.path ?? "" };
    }),
    async (c) => {
      try {
        const entries = await listDirectory(c.req.valid("query").path, root);
        return c.json({ entries }, 200);
      } catch (error) {
        if (error instanceof PublicPathError) {
          return error.code === "FORBIDDEN" ? API_ERROR.forbidden(c) : API_ERROR.notFound(c);
        }
        const code = error instanceof Error && "code" in error ? error.code : undefined;
        if (code === "ENOENT") return API_ERROR.notFound(c);
        if (code === "ENOTDIR") return API_ERROR.notDirectory(c);
        if (code === "EACCES" || code === "EPERM") {
          return API_ERROR.forbidden(c);
        }
        return API_ERROR.internal(c);
      }
    },
  );
}
