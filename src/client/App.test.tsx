import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Hello from Hono!" })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the greeting fetched through RPC", async () => {
    render(<App />);

    expect(screen.getByRole("status").textContent).toBe("API を読み込み中…");
    expect(await screen.findByText("Hello from Hono!")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/hello", expect.objectContaining({ method: "GET" }));
  });

  it("shows an error when the API returns a failure", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe("API の取得に失敗しました。");
  });

  it("shows an error when the network request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Network error"));
    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toBe("API の取得に失敗しました。");
  });

  it("shows the initial count", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Count is 0" }).textContent).toBe("Count is 0");
  });

  it("increments the count when clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Count is 0" }));

    expect(screen.getByRole("button", { name: "Count is 1" }).textContent).toBe("Count is 1");
  });
});
