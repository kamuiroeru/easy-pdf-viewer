import { Hono } from "hono";

export const app = new Hono().get("/api/hello", (c) => {
  return c.json({ message: "Hello from Hono!" }, 200);
});

export type AppType = typeof app;
