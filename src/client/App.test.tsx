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

  it("separates files and folders and navigates to a parent and back", async () => {
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
    const directories = await screen.findByRole("region", { name: "Directories 1" });
    const files = screen.getByRole("region", { name: "Files 1" });
    expect(directories.textContent).toContain("次のフォルダ/");
    expect(directories.textContent).not.toContain("book.pdf");
    expect(files.textContent).toContain("book.pdf");
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

  it("filters both sections by case-insensitive name substrings without fetching", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        entries: [
          { kind: "directory", name: "My BOOKS", path: "My BOOKS" },
          { kind: "directory", name: "写真", path: "写真" },
          { kind: "file", name: "Handbook.pdf", path: "Handbook.pdf", format: "pdf" },
          { kind: "file", name: "日本語.pdf", path: "日本語.pdf", format: "pdf" },
        ],
      }),
    );
    renderDirectory();
    const search = await screen.findByRole("searchbox", { name: "フォルダ名・ファイル名を検索" });
    await user.type(search, "bOoK");
    expect(screen.getByRole("region", { name: "Directories 1" }).textContent).toContain(
      "My BOOKS/",
    );
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain("Handbook.pdf");
    expect(screen.queryByText("写真/")).toBeNull();
    expect(screen.queryByText("日本語.pdf")).toBeNull();
    await user.clear(search);
    await user.type(search, "該当なし");
    expect(screen.getByText("一致するフォルダはありません。")).toBeTruthy();
    expect(screen.getByText("一致するファイルはありません。")).toBeTruthy();
    expect(screen.queryByText("このディレクトリは空です。")).toBeNull();
    await user.clear(search);
    await user.type(search, "日本語");
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain("日本語.pdf");
    await user.clear(search);
    expect(screen.getByRole("region", { name: "Directories 2" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Files 2" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["いうえ", "あいうエオ", "アイウえオ.pdf"],
    ["イウエ", "あいうエオ", "アイウえオ.pdf"],
    ["がいど", "ガイド", "ガイド.pdf"],
    ["きゃ", "キャラクター", "キャラクター.pdf"],
  ])("matches hiragana and full-width katakana for %s", async (query, folder, file) => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        entries: [
          { kind: "directory", name: folder, path: folder },
          { kind: "file", name: file, path: file, format: "pdf" },
          { kind: "directory", name: "別のフォルダ", path: "別のフォルダ" },
          { kind: "file", name: "別の資料.pdf", path: "別の資料.pdf", format: "pdf" },
        ],
      }),
    );
    renderDirectory();
    await user.type(await screen.findByRole("searchbox"), query);
    expect(screen.getByRole("region", { name: "Directories 1" }).textContent).toContain(
      `${folder}/`,
    );
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain(file);
    expect(fetch).toHaveBeenCalledTimes(1);
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
