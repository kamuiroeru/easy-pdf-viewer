import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vite-plus/test";
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
  expect(link.querySelector("img")?.getAttribute("loading")).toBe("lazy");
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
  expect(images[0]?.getAttribute("loading")).toBe("lazy");
  expect(document.querySelector("video")).toBeNull();
  expect(document.querySelector('[src*="%E5%8B%95%E7%94%BB.webm"]')).toBeNull();
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.removeAttribute("open");
    fireEvent(this, new Event("close"));
  };
});

it.each(["gif", "png", "jpeg"] as const)("opens and closes a %s image", (format) => {
  render(
    <FileList
      files={[{ kind: "file", name: `画像.${format}`, path: `資料/画像.${format}`, format }]}
      hasQuery={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: `画像.${format}` }));
  const dialog = screen.getByRole("dialog", { name: `画像.${format}` });
  expect(dialog.querySelector("img")?.getAttribute("src")).toBe(
    `/api/files?path=${encodeURIComponent(`資料/画像.${format}`)}`,
  );
  fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("button", { name: `画像.${format}` })).toBeTruthy();
});

it("loads a video only while its viewer is open and closes on the dialog close event", () => {
  render(
    <FileList
      files={[{ kind: "file", name: "動画.webm", path: "動画.webm", format: "webm" }]}
      hasQuery={false}
    />,
  );
  expect(document.querySelector("video")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "動画.webm" }));
  const dialog = screen.getByRole("dialog");
  const video = dialog.querySelector("video");
  expect(video?.getAttribute("src")).toBe(`/api/files?path=${encodeURIComponent("動画.webm")}`);
  expect(video?.controls).toBe(true);
  fireEvent(dialog, new Event("close"));
  expect(document.querySelector("video")).toBeNull();
});

it("navigates media in list order, skipping PDFs and stopping at both ends", () => {
  render(
    <FileList
      files={[
        { kind: "file", name: "a.png", path: "a.png", format: "png" },
        { kind: "file", name: "b.pdf", path: "b.pdf", format: "pdf" },
        { kind: "file", name: "c.webm", path: "c.webm", format: "webm" },
        { kind: "file", name: "d.webm", path: "d.webm", format: "webm" },
        { kind: "file", name: "e.gif", path: "e.gif", format: "gif" },
      ]}
      hasQuery={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "a.png" }));
  const previous = screen.getByRole("button", { name: "前のメディア" }) as HTMLButtonElement;
  const next = screen.getByRole("button", { name: "次のメディア" }) as HTMLButtonElement;
  expect(previous.disabled).toBe(true);
  fireEvent.click(next);
  expect(screen.getByRole("dialog", { name: "c.webm" })).toBeTruthy();
  const video = document.querySelector("video");
  fireEvent.click(next);
  expect(video?.isConnected).toBe(false);
  expect(document.querySelector("video")?.getAttribute("src")).toContain("d.webm");
  fireEvent.click(next);
  expect(screen.getByRole("dialog", { name: "e.gif" })).toBeTruthy();
  expect(next.disabled).toBe(true);
  fireEvent.click(previous);
  expect(screen.getByRole("dialog", { name: "d.webm" })).toBeTruthy();
});
