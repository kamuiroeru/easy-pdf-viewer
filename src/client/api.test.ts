import { hc } from "hono/client";
import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import { app } from "../server/app.ts";
import type { AppType } from "../server/app.ts";
import type { HelloResponse } from "./api.ts";

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
