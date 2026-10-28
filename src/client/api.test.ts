import { hc } from "hono/client";
import { describe, expect, expectTypeOf, it, vi } from "vite-plus/test";
import { app } from "@be/app.ts";
import type { DirectoryEntry } from "@s/directory.ts";
import type { AppType } from "@be/app.ts";
import type { DirectoryErrorResponse, DirectoryResponse, HelloResponse } from "./api.ts";

it("exposes directory errors without the successful response body", () => {
  expectTypeOf<DirectoryErrorResponse>().toEqualTypeOf<
    | { error: { code: "INVALID_PATH"; message: string } }
    | { error: { code: "NOT_DIRECTORY"; message: string } }
    | { error: { code: "FORBIDDEN"; message: string } }
    | { error: { code: "NOT_FOUND"; message: string } }
    | { error: { code: "INTERNAL_ERROR"; message: string } }
  >();
});

describe("Hono RPC", () => {
  it("infers the server response type on the client", async () => {
    const client = hc<AppType>("http://localhost", {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
    });
    const response = await client.api.hello.$get();
    expect(response.status).toBe(200);
    if (response.status !== 200) throw new Error("Expected success");
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
        | { error: { code: "INVALID_PATH"; message: string } }
        | { error: { code: "NOT_DIRECTORY"; message: string } }
      >();
      expect(body).toMatchObject({ error: { code: "INVALID_PATH", message: expect.any(String) } });
      break;
    }
    case 403:
      expectTypeOf(await response.json()).toEqualTypeOf<{
        error: { code: "FORBIDDEN"; message: string };
      }>();
      break;
    case 404:
      expectTypeOf(await response.json()).toEqualTypeOf<{
        error: { code: "NOT_FOUND"; message: string };
      }>();
      break;
    case 500:
      expectTypeOf(await response.json()).toEqualTypeOf<{
        error: { code: "INTERNAL_ERROR"; message: string };
      }>();
      break;
    default:
      expectTypeOf(response).toEqualTypeOf<never>();
  }
});

it("exposes unexpected directory failures as a typed 500 response", async () => {
  const service = await import("@be/services/directoryListing.ts");
  const failure = vi.spyOn(service, "listDirectoryResult").mockRejectedValue(new Error("private"));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const client = hc<AppType>("http://localhost", {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
    });
    const response = await client.api.directories.$get({ query: { path: "" } });
    expect(response.status).toBe(500);
    if (response.status !== 500) throw new Error("Expected server error");
    expect(await response.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "サーバーでエラーが起きました" },
    });
  } finally {
    failure.mockRestore();
    log.mockRestore();
  }
});
