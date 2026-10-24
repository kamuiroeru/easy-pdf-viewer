import type { Context } from "hono";

export const API_ERROR = {
  invalidPath: (c: Context) => c.json({ error: "INVALID_PATH" } as const, 400),
  notDirectory: (c: Context) => c.json({ error: "NOT_DIRECTORY" } as const, 400),
  forbidden: (c: Context) => c.json({ error: "FORBIDDEN" } as const, 403),
  notFound: (c: Context) => c.json({ error: "NOT_FOUND" } as const, 404),
  internal: (c: Context) => c.json({ error: "INTERNAL_ERROR" } as const, 500),
} as const;
