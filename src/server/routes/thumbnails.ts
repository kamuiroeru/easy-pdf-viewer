import { open, stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_ERROR } from "@be/apiErrors.ts";
import { env } from "@be/env.ts";
import { PublicPathError, resolvePublicPath } from "@be/publicPaths.ts";

/** GET /?path=<URL-encoded relative PDF path>. */
export function createThumbnailRoutes(root = env.THUMBNAIL_ROOT) {
  return new Hono().get(
    "/",
    validator("query", (query, c) => {
      if (typeof query.path !== "string" || !/\.pdf$/i.test(query.path)) {
        return API_ERROR.invalidPath(c);
      }
      return { path: query.path };
    }),
    async (c) => {
      try {
        const path = c.req.valid("query").path.replace(/\.pdf$/i, ".jpg");
        const file = await resolvePublicPath(root, path);
        if (extname(file).toLowerCase() !== ".jpg" || !(await stat(file)).isFile()) {
          return API_ERROR.forbidden(c);
        }
        const handle = await open(file, "r");
        try {
          const info = await handle.stat();
          if (!info.isFile()) {
            await handle.close();
            return API_ERROR.forbidden(c);
          }
          c.header("Content-Type", "image/jpeg");
          c.header("Content-Length", String(info.size));
          c.header("X-Content-Type-Options", "nosniff");
          return c.body(Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>);
        } catch (error) {
          await handle.close();
          throw error;
        }
      } catch (error) {
        if (error instanceof PublicPathError) {
          return error.code === "FORBIDDEN" ? API_ERROR.forbidden(c) : API_ERROR.notFound(c);
        }
        const code = error instanceof Error && "code" in error ? error.code : undefined;
        if (code === "ENOENT" || code === "ENOTDIR") return API_ERROR.notFound(c);
        if (code === "EACCES" || code === "EPERM" || code === "EISDIR") {
          return API_ERROR.forbidden(c);
        }
        return API_ERROR.internal(c);
      }
    },
  );
}
