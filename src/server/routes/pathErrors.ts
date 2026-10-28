import type { Context } from "hono";
import { failureResponse } from "@be/apiErrors.ts";
import { pathFailure } from "@be/services/pathFailures.ts";

export function pathErrorResponse(c: Context, error: unknown, target: "file" | "directory") {
  return failureResponse(c, pathFailure(error, target));
}
