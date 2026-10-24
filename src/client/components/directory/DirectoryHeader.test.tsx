import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vite-plus/test";
import { DirectoryHeader } from "./DirectoryHeader";

it("shows the current path and query and notifies the caller of edits", async () => {
  const user = userEvent.setup();
  const onQueryChange = vi.fn();
  render(<DirectoryHeader path="日本語/子 #" query="book" onQueryChange={onQueryChange} />);
  expect(screen.getByText("現在のディレクトリ: /日本語/子 #")).toBeTruthy();
  const search = screen.getByRole("searchbox", { name: "フォルダ名・ファイル名を検索" });
  expect((search as HTMLInputElement).value).toBe("book");
  await user.type(search, "s");
  expect(onQueryChange).toHaveBeenLastCalledWith("books");
});
