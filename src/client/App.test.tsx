import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { routes } from "./router";

function renderDirectory(url = "/") {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("directory routes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ entries: [] })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads the root and shows an empty directory", async () => {
    renderDirectory();
    expect(screen.getByRole("status").textContent).toContain("読み込み中");
    expect(await screen.findByText("このディレクトリは空です。")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "親ディレクトリへ戻る" })).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      "/api/directories?path=",
      expect.objectContaining({ method: "GET", signal: expect.any(AbortSignal) }),
    );
  });

  it("loads a directory directly from its URL without changing special characters", async () => {
    const path = "日本語/100% # & +.pdf";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        entries: [{ kind: "file", name: "book.pdf", path: `${path}/book.pdf`, format: "pdf" }],
      }),
    );
    renderDirectory(`/?${new URLSearchParams({ path })}`);
    expect(await screen.findByText("book.pdf")).toBeTruthy();
    expect(
      new URL(vi.mocked(fetch).mock.calls[0]![0] as string, "http://localhost").searchParams.get(
        "path",
      ),
    ).toBe(path);
    expect(screen.getByText(`現在のディレクトリ: /${path}`)).toBeTruthy();
  });

  it("navigates to children, shows pending state, and returns to the root", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ entries: [{ kind: "directory", name: "子 #", path: "子 #" }] }),
    );
    const router = renderDirectory();
    const child = await screen.findByRole("link", { name: "子 #/" });
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await user.click(child);
    expect(screen.getByRole("status").textContent).toContain("読み込み中");
    resolve(Response.json({ entries: [] }));
    expect(await screen.findByText("現在のディレクトリ: /子 #")).toBeTruthy();
    expect(new URLSearchParams(router.state.location.search).get("path")).toBe("子 #");
    await user.click(screen.getByRole("link", { name: "親ディレクトリへ戻る" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(await screen.findByText("現在のディレクトリ: /")).toBeTruthy();
  });

  it("navigates to a parent and back through history", async () => {
    const user = userEvent.setup();
    const path = "日本語 空白/子 # & +";
    vi.mocked(fetch).mockImplementation(async () =>
      Response.json({
        entries: [
          { kind: "directory", name: "次のフォルダ", path: `${path}/次のフォルダ` },
          { kind: "file", name: "book.pdf", path: `${path}/book.pdf`, format: "pdf" },
        ],
      }),
    );
    const router = renderDirectory(`/?${new URLSearchParams({ path })}`);
    await screen.findByText(`現在のディレクトリ: /${path}`);
    await user.click(screen.getByRole("link", { name: "親ディレクトリへ戻る" }));
    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get("path")).toBe("日本語 空白"),
    );
    await router.navigate(-1);
    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get("path")).toBe(path),
    );
    expect(screen.getByText(`現在のディレクトリ: /${path}`)).toBeTruthy();
  });

  it("clears the search on child, parent, and history navigation and matches names only", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (input) => {
      const path = new URL(input as string, "http://localhost").searchParams.get("path");
      return Response.json({
        entries: path
          ? [{ kind: "file", name: "Other.pdf", path: "Books/Other.pdf", format: "pdf" }]
          : [{ kind: "directory", name: "Books", path: "Books" }],
      });
    });
    const router = renderDirectory();
    const search = () => screen.getByRole("searchbox") as HTMLInputElement;
    await screen.findByRole("link", { name: "Books/" });
    await user.type(search(), "book");
    expect(fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("link", { name: "Books/" }));
    await screen.findByText("Other.pdf");
    expect(search().value).toBe("");
    await user.type(search(), "book");
    expect(screen.queryByText("Other.pdf")).toBeNull();
    await user.click(screen.getByRole("link", { name: "親ディレクトリへ戻る" }));
    await screen.findByRole("link", { name: "Books/" });
    expect(search().value).toBe("");
    await user.type(search(), "book");
    await router.navigate(-1);
    await screen.findByText("Other.pdf");
    expect(search().value).toBe("");
  });

  it.each([403, 404, 500])("shows an error for HTTP %i", async (status) => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status }));
    renderDirectory("/?path=missing");
    expect((await screen.findByRole("alert")).textContent).toBe(
      "ディレクトリの取得に失敗しました。",
    );
  });

  it("shows an error for network failures", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Network error"));
    renderDirectory();
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
