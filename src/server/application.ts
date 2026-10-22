import { fileURLToPath } from "node:url";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app } from "./app.ts";

export function createServerApp(
  appEnv = process.env.APP_ENV ?? "dev",
  clientRoot = fileURLToPath(new URL("../../dist/client/", import.meta.url)),
) {
  if (appEnv !== "prod") {
    return app;
  }

  return new Hono()
    .route("/", app)
    .all("/api", (c) => c.notFound())
    .all("/api/*", (c) => c.notFound())
    .use("/*", serveStatic({ root: clientRoot }));
}
