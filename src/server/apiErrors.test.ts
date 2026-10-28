import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { expect, it, vi } from "vite-plus/test";
import { notFound, onError } from "./apiErrors.ts";

it("returns HTTP exceptions in the shared format", async () => {
  const app = new Hono().onError(onError).get("/", () => {
    throw new HTTPException(400, { message: "Invalid request" });
  });
  const response = await app.request("/");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: { code: "HTTP_ERROR", message: "Invalid request" },
  });
});

it("logs unexpected errors without exposing details", async () => {
  const error = new Error("private details");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const app = new Hono().onError(onError).get("/", () => {
      throw error;
    });
    const response = await app.request("/");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "サーバーでエラーが起きました" },
    });
    expect(log).toHaveBeenCalledWith(error);
  } finally {
    log.mockRestore();
  }
});

it("returns unknown routes in the shared format", async () => {
  const response = await new Hono().notFound(notFound).request("/missing");
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: "ROUTE_NOT_FOUND", message: "ルートが見つかりません" },
  });
});
