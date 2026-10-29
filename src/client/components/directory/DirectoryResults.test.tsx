import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vite-plus/test";
import type { DirectoryEntry } from "@s/directory";
import { DirectoryResults } from "./DirectoryResults";

const entries: DirectoryEntry[] = [
  { kind: "directory", name: "My BOOKS", path: "My BOOKS" },
  { kind: "directory", name: "写真", path: "写真" },
  { kind: "file", name: "Handbook.pdf", path: "Handbook.pdf", format: "pdf" },
  { kind: "file", name: "日本語.pdf", path: "日本語.pdf", format: "pdf" },
];

function results(query: string, items = entries) {
  return (
    <MemoryRouter>
      <DirectoryResults entries={items} query={query} />
    </MemoryRouter>
  );
}

describe("DirectoryResults", () => {
  it("navigates only among matching media", () => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.setAttribute("open", "");
    };
    render(
      results("match", [
        { kind: "file", name: "match-a.jpeg", path: "match-a.jpeg", format: "jpeg" },
        { kind: "file", name: "other.png", path: "other.png", format: "png" },
        { kind: "file", name: "match-b.gif", path: "match-b.gif", format: "gif" },
      ]),
    );
    fireEvent.click(screen.getByRole("button", { name: "match-a.jpeg" }));
    fireEvent.click(screen.getByRole("button", { name: "次のメディア" }));
    expect(screen.getByRole("dialog", { name: "match-b.gif" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "次のメディア" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
  it("groups entries and filters names case-insensitively, then restores them when cleared", () => {
    const { rerender } = render(results("bOoK"));
    expect(screen.getByRole("region", { name: "Directories 1" }).textContent).toContain(
      "My BOOKS/",
    );
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain("Handbook.pdf");
    expect(screen.queryByText("写真/")).toBeNull();
    expect(screen.queryByText("日本語.pdf")).toBeNull();
    rerender(results("日本語"));
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain("日本語.pdf");
    rerender(results(""));
    expect(screen.getByRole("region", { name: "Directories 2" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Files 2" })).toBeTruthy();
  });

  it("matches entry names rather than their parent path", () => {
    render(
      results("books", [
        { kind: "file", name: "Other.pdf", path: "Books/Other.pdf", format: "pdf" },
      ]),
    );
    expect(screen.queryByText("Other.pdf")).toBeNull();
    expect(screen.getByText("一致するファイルはありません。")).toBeTruthy();
  });

  it.each([
    ["いうえ", "あいうエオ", "アイウえオ.pdf"],
    ["イウエ", "あいうエオ", "アイウえオ.pdf"],
    ["がいど", "ガイド", "ガイド.pdf"],
    ["きゃ", "キャラクター", "キャラクター.pdf"],
  ])("matches hiragana and katakana for %s", (query, folder, file) => {
    render(
      results(query, [
        { kind: "directory", name: folder, path: folder },
        { kind: "file", name: file, path: file, format: "pdf" },
        ...entries,
      ]),
    );
    expect(screen.getByRole("region", { name: "Directories 1" }).textContent).toContain(
      `${folder}/`,
    );
    expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain(file);
  });
});
