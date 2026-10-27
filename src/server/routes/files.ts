import { open, stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { API_ERROR } from "@be/apiErrors.ts";
import { env } from "@be/env.ts";
import { resolvePublicPath } from "@be/services/publicPaths.ts";
import { BYTE_RANGE_KIND, parseByteRange, type ByteRangeResult } from "@be/http/byteRange.ts";
import { pathErrorResponse } from "./pathErrors.ts";

const contentTypes = new Map([
  [".pdf", "application/pdf"],
  [".gif", "image/gif"],
  [".webm", "video/webm"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
]);

/** GET /?path=<URL-encoded relative file path>. */
export function createFileRoutes(root = env.CONTENT_ROOT) {
  return new Hono().get(
    "/",
    validator("query", (query, c) => {
      if (typeof query.path !== "string" || query.path === "") {
        return API_ERROR.invalidPath(c);
      }
      return { path: query.path };
    }),
    async (c) => {
      try {
        const path = c.req.valid("query").path;
        const file = await resolvePublicPath(root, path);
        const contentType = contentTypes.get(extname(path).toLowerCase());
        // Validate the real target too, so aliases cannot expose unsupported files.
        if (!contentType || !contentTypes.has(extname(file).toLowerCase())) {
          return API_ERROR.forbidden(c);
        }
        if (!(await stat(file)).isFile()) return API_ERROR.forbidden(c);
        const handle = await open(file, "r");
        try {
          const info = await handle.stat();
          if (!info.isFile()) {
            await handle.close();
            return API_ERROR.forbidden(c);
          }
          c.header("Accept-Ranges", "bytes");
          c.header("X-Content-Type-Options", "nosniff");
          const range: ByteRangeResult =
            c.req.header("If-Range") === undefined
              ? parseByteRange(c.req.header("Range"), info.size)
              : { kind: BYTE_RANGE_KIND.IGNORE };
          if (range.kind === BYTE_RANGE_KIND.UNSATISFIABLE) {
            await handle.close();
            c.header("Content-Range", `bytes */${info.size}`);
            c.header("Content-Length", "0");
            return c.body(null, 416);
          }
          c.header("Content-Type", contentType);
          if (range.kind === BYTE_RANGE_KIND.PARTIAL) {
            c.header("Content-Range", `bytes ${range.start}-${range.end}/${info.size}`);
            c.header("Content-Length", String(range.end - range.start + 1));
            return c.body(
              Readable.toWeb(handle.createReadStream(range)) as ReadableStream<Uint8Array>,
              206,
            );
          }
          c.header("Content-Length", String(info.size));
          return c.body(Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>);
        } catch (error) {
          await handle.close();
          throw error;
        }
      } catch (error) {
        return pathErrorResponse(c, error, "file");
      }
    },
  );
}
