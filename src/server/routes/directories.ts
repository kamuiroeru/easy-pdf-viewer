import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_ERROR } from "@be/apiErrors.ts";
import { listDirectory } from "@be/services/directoryListing.ts";
import { pathErrorResponse } from "./pathErrors.ts";

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
        return pathErrorResponse(c, error, "directory");
      }
    },
  );
}
