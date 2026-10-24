import { hc } from "hono/client";
import type { InferResponseType } from "hono/client";
import type { AppType } from "@be/app.ts";

export const api = hc<AppType>("/");

export type HelloResponse = InferResponseType<typeof api.api.hello.$get>;
export type DirectoryResponse = InferResponseType<typeof api.api.directories.$get, 200>;
