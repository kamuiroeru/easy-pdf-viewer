import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app } from "@be/app.ts";
import { env } from "@be/env.ts";

export function createServerApp(
  appEnv = env.APP_ENV,
  clientRoot = fileURLToPath(new URL("../../dist/client/", import.meta.url)),
) {
  if (appEnv !== "prod") {
    return app;
  }

  const serveClient = serveStatic({ root: clientRoot, path: "index.html" });

  return new Hono()
    .route("/", app)
    .all("/api", (c) => c.notFound())
    .all("/api/*", (c) => c.notFound())
    .use("/*", serveStatic({ root: clientRoot }))
    .use("/*", async (c, next) => {
      const path = c.req.path;
      // Reserve the asset directory and file-like paths for static files.
      if (path === "/assets" || path.startsWith("/assets/") || /\.[^/]+\/?$/.test(path)) {
        return c.notFound();
      }
      return serveClient(c, next);
    });
}
