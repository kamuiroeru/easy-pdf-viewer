import type { Context, TypedResponse } from "hono";

export const API_ERROR = {
  invalidPath: (
    c: Context,
  ): Response & TypedResponse<{ readonly error: "INVALID_PATH" }, 400, "json"> =>
    c.json({ error: "INVALID_PATH" } as const, 400),
  notDirectory: (
    c: Context,
  ): Response & TypedResponse<{ readonly error: "NOT_DIRECTORY" }, 400, "json"> =>
    c.json({ error: "NOT_DIRECTORY" } as const, 400),
  forbidden: (c: Context): Response & TypedResponse<{ readonly error: "FORBIDDEN" }, 403, "json"> =>
    c.json({ error: "FORBIDDEN" } as const, 403),
  notFound: (c: Context): Response & TypedResponse<{ readonly error: "NOT_FOUND" }, 404, "json"> =>
    c.json({ error: "NOT_FOUND" } as const, 404),
  internal: (
    c: Context,
  ): Response & TypedResponse<{ readonly error: "INTERNAL_ERROR" }, 500, "json"> =>
    c.json({ error: "INTERNAL_ERROR" } as const, 500),
} as const;
