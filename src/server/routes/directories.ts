import { FAILURE } from "@be/services/failures.ts";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { failureResponse, onError } from "@be/apiErrors.ts";
import { listDirectoryResult } from "@be/services/directoryListing.ts";

/** GET /?path=<URL-encoded relative path>; omitted or empty path selects the root. */
export function createDirectoryRoutes(root?: string) {
  return new Hono().onError(onError).get(
    "/",
    validator("query", (query, c) => {
      if (Array.isArray(query.path)) {
        return failureResponse(c, FAILURE.INVALID_PATH);
      }
      return { path: query.path ?? "" };
    }),
    async (c) => {
      const result = await listDirectoryResult(c.req.valid("query").path, root);
      if (!result.ok) return failureResponse(c, result.error);
      return c.json({ entries: result.value }, 200);
    },
  );
}
