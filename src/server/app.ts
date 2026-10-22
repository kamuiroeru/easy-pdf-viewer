import { Hono } from "hono";
import { sleepMs } from "../shared/debugUtil.ts";

export const app = new Hono().get("/api/hello", async (c) => {
  await sleepMs(1000);
  return c.json({ message: "Hello from Hono!" }, 200);
});

export type AppType = typeof app;
