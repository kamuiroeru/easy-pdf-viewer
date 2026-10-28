import { Hono } from "hono";
import { expect, it } from "vite-plus/test";
import { onError } from "@be/apiErrors.ts";
import { PublicPathError } from "@be/services/publicPaths.ts";
import { pathErrorResponse } from "./pathErrors.ts";

it.each([
  [new PublicPathError("FORBIDDEN"), "file", 403, "FORBIDDEN"],
  [new PublicPathError("NOT_FOUND"), "directory", 404, "NOT_FOUND"],
  [Object.assign(new Error(), { code: "ENOENT" }), "file", 404, "NOT_FOUND"],
  [Object.assign(new Error(), { code: "ENOTDIR" }), "file", 404, "NOT_FOUND"],
  [Object.assign(new Error(), { code: "ENOTDIR" }), "directory", 400, "NOT_DIRECTORY"],
  [Object.assign(new Error(), { code: "EACCES" }), "directory", 403, "FORBIDDEN"],
  [Object.assign(new Error(), { code: "EPERM" }), "file", 403, "FORBIDDEN"],
  [Object.assign(new Error(), { code: "EISDIR" }), "file", 403, "FORBIDDEN"],
  [Object.assign(new Error(), { code: "EISDIR" }), "directory", 500, "INTERNAL_ERROR"],
  [new Error("private path"), "file", 500, "INTERNAL_ERROR"],
  [{ code: "ENOENT" }, "file", 500, "INTERNAL_ERROR"],
] as const)("maps path errors for %s (%s)", async (error, target, status, body) => {
  const app = new Hono().onError(onError).get("/", (c) => pathErrorResponse(c, error, target));
  const response = await app.request("/");
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    error: { code: body, message: expect.any(String) },
  });
});
