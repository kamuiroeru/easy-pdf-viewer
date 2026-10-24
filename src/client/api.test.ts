import { hc } from "hono/client";
import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import { app } from "@be/app.ts";
import type { DirectoryEntry } from "@s/directory.ts";
import type { AppType } from "@be/app.ts";
import type { DirectoryResponse, HelloResponse } from "./api.ts";

describe("Hono RPC", () => {
  it("infers the server response type on the client", async () => {
    const client = hc<AppType>("http://localhost", {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
    });
    const response = await client.api.hello.$get();
    const data = await response.json();

    expectTypeOf(data).toEqualTypeOf<HelloResponse>();
    expectTypeOf(data).toEqualTypeOf<{ message: string }>();
    expectTypeOf(response.status).toEqualTypeOf<200>();
    expect(data.message).toBe("Hello from Hono!");
  });
});

it("exposes typed directory requests and responses through RPC", () => {
  const client = hc<AppType>("http://localhost");
  expectTypeOf<DirectoryResponse>().toExtend<{ entries: DirectoryEntry[] }>();
  expectTypeOf<{ entries: DirectoryEntry[] }>().toExtend<DirectoryResponse>();
  expectTypeOf(client.api.directories.$get).parameter(0).toExtend<{
    query: { path?: string | string[] };
  }>();
});

it("preserves each error body and narrows RPC responses by HTTP status", async () => {
  const client = hc<AppType>("http://localhost", {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
  });
  const response = await client.api.directories.$get({ query: { path: ["a", "b"] } });
  expect(response.status).toBe(400);
  expectTypeOf(response.status).toEqualTypeOf<200 | 400 | 403 | 404 | 500>();

  switch (response.status) {
    case 200: {
      const body = await response.json();
      expectTypeOf(body).toExtend<{ entries: DirectoryEntry[] }>();
      break;
    }
    case 400: {
      const body = await response.json();
      expectTypeOf(body).toEqualTypeOf<
        { readonly error: "INVALID_PATH" } | { readonly error: "NOT_DIRECTORY" }
      >();
      expect(body).toEqual({ error: "INVALID_PATH" });
      break;
    }
    case 403:
      expectTypeOf(await response.json()).toEqualTypeOf<{ readonly error: "FORBIDDEN" }>();
      break;
    case 404:
      expectTypeOf(await response.json()).toEqualTypeOf<{ readonly error: "NOT_FOUND" }>();
      break;
    case 500:
      expectTypeOf(await response.json()).toEqualTypeOf<{ readonly error: "INTERNAL_ERROR" }>();
      break;
    default:
      expectTypeOf(response).toEqualTypeOf<never>();
  }
});
