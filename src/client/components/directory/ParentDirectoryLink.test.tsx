import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, it } from "vite-plus/test";
import { ParentDirectoryLink } from "./ParentDirectoryLink";

it.each([
  ["Books", "/"],
  ["日本語 # & +/子", `/?${new URLSearchParams({ path: "日本語 # & +" })}`],
])("links from %s to its parent", (path, expected) => {
  render(
    <MemoryRouter>
      <ParentDirectoryLink path={path} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "親ディレクトリへ戻る" }).getAttribute("href")).toBe(
    expected,
  );
});
