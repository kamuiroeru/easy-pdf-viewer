import { fireEvent, render, screen } from "@testing-library/react";
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

it("links PDFs to the file API and loads their thumbnails", () => {
  render(
    <FileList
      files={[
        { kind: "file", name: "長い 日本語.PDF", path: "資料/長い 日本語.PDF", format: "pdf" },
      ]}
      hasQuery={false}
    />,
  );
  const link = screen.getByRole("link");
  expect(link.getAttribute("href")).toBe(
    `/api/files?path=${encodeURIComponent("資料/長い 日本語.PDF")}`,
  );
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.textContent).toContain("長い 日本語");
  expect(link.querySelector("img")?.getAttribute("src")).toBe(
    `/api/thumbnails?path=${encodeURIComponent("資料/長い 日本語.PDF")}`,
  );
});

it("preserves the PDF link and name when the thumbnail fails", () => {
  render(
    <FileList
      files={[{ kind: "file", name: "missing.pdf", path: "missing.pdf", format: "pdf" }]}
      hasQuery={false}
    />,
  );
  const link = screen.getByRole("link");
  const image = link.querySelector("img");
  if (!image) throw new Error("thumbnail missing");
  fireEvent.error(image);
  expect(link.querySelector("img")).toBeNull();
  expect(link.textContent).toContain("missing.pdf");
  expect(link.getAttribute("href")).toContain("/api/files?");
});

it("loads images from the file API without requesting WebM videos", () => {
  render(
    <FileList
      files={[
        { kind: "file", name: "画像.png", path: "画像.png", format: "png" },
        { kind: "file", name: "動画.webm", path: "動画.webm", format: "webm" },
      ]}
      hasQuery={false}
    />,
  );
  const images = document.querySelectorAll("img");
  expect(images).toHaveLength(1);
  expect(images[0]?.getAttribute("src")).toBe(`/api/files?path=${encodeURIComponent("画像.png")}`);
  expect(document.querySelector("video")).toBeNull();
});
