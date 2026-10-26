import { Hono } from "hono";
import { createDirectoryRoutes } from "@be/routes/directories.ts";
import { createFileRoutes } from "@be/routes/files.ts";
import { createThumbnailRoutes } from "@be/routes/thumbnails.ts";

export const app = new Hono()
  .route("/api/directories", createDirectoryRoutes())
  .route("/api/files", createFileRoutes())
  .route("/api/thumbnails", createThumbnailRoutes())
  .get("/api/hello", (c) => {
    return c.json({ message: "Hello from Hono!" }, 200);
  });

export type AppType = typeof app;
