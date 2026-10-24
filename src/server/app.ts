import { Hono } from "hono";
import { createDirectoryRoutes } from "@be/routes/directories.ts";

export const app = new Hono()
  .route("/api/directories", createDirectoryRoutes())
  .get("/api/hello", (c) => {
    return c.json({ message: "Hello from Hono!" }, 200);
  });

export type AppType = typeof app;
