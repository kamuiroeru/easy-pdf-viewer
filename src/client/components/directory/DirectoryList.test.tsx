import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, it } from "vite-plus/test";
import { DirectoryList } from "./DirectoryList";

it("shows folder counts and encoded navigation links", () => {
  const path = "日本語/子 # & +";
  render(
    <MemoryRouter>
      <DirectoryList
        directories={[{ kind: "directory", name: "子 # & +", path }]}
        hasQuery={false}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole("region", { name: "Directories 1" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "子 # & +/" }).getAttribute("href")).toBe(
    `/?${new URLSearchParams({ path })}`,
  );
});

it.each([false, true])("shows the appropriate empty message with hasQuery=%s", (hasQuery) => {
  render(
    <MemoryRouter>
      <DirectoryList directories={[]} hasQuery={hasQuery} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("region", { name: "Directories 0" })).toBeTruthy();
  expect(
    screen.getByText(hasQuery ? "一致するフォルダはありません。" : "フォルダはありません。"),
  ).toBeTruthy();
});
