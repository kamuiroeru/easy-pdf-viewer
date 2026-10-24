import { render, screen } from "@testing-library/react";
import { expect, it } from "vite-plus/test";
import { FileList } from "./FileList";

it("shows the file count and names", () => {
  render(
    <FileList
      files={[{ kind: "file", name: "日本語.pdf", path: "日本語.pdf", format: "pdf" }]}
      hasQuery={false}
    />,
  );
  expect(screen.getByRole("region", { name: "Files 1" }).textContent).toContain("日本語.pdf");
});

it.each([false, true])("shows the appropriate empty message with hasQuery=%s", (hasQuery) => {
  render(<FileList files={[]} hasQuery={hasQuery} />);
  expect(screen.getByRole("region", { name: "Files 0" })).toBeTruthy();
  expect(
    screen.getByText(hasQuery ? "一致するファイルはありません。" : "ファイルはありません。"),
  ).toBeTruthy();
});
