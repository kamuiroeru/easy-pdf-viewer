import { describe, expect, it } from "vite-plus/test";
import { app } from "./app.ts";

it("registers the thumbnail delivery API", async () => {
  const response = await app.request("/api/thumbnails");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "INVALID_PATH" });
});

it("registers the file delivery API", async () => {
  const response = await app.request("/api/files");
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "INVALID_PATH" });
});

describe("GET /api/hello", () => {
  it("returns a JSON greeting", async () => {
    const response = await app.request("/api/hello");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ message: "Hello from Hono!" });
  });

  it("returns 404 for an unknown route", async () => {
    const response = await app.request("/api/unknown");

    expect(response.status).toBe(404);
  });
});
