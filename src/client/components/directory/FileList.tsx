import { FileImage, FileVideo } from "lucide-react";
import { useState } from "react";
import { FILE_FORMAT, type DirectoryEntry } from "@s/directory";
import { MediaViewer } from "./MediaViewer";

function FileCard(props: {
  entry: Extract<DirectoryEntry, { kind: "file" }>;
  onOpen: (entry: Extract<DirectoryEntry, { kind: "file" }>) => void;
}) {
  const { entry, onOpen } = props;
  const [imageFailed, setImageFailed] = useState(false);
  const fileUrl = `/api/files?path=${encodeURIComponent(entry.path)}`;
  const imageUrl =
    entry.format === FILE_FORMAT.PDF
      ? `/api/thumbnails?path=${encodeURIComponent(entry.path)}`
      : fileUrl;
  const title = entry.name.replace(/\.[^.]+$/, "") || entry.name;
  const preview = entry.format !== FILE_FORMAT.WEBM && !imageFailed;
  const content = (
    <>
      <span
        className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#14271c] text-[#9eafa3]"
        aria-hidden="true"
      >
        {preview ? (
          <img
            className="h-full w-full object-cover"
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : entry.format === FILE_FORMAT.WEBM ? (
          <FileVideo />
        ) : (
          <FileImage />
        )}
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm text-[#9eafa3]">{entry.name}</span>
      </span>
    </>
  );

  return entry.format === FILE_FORMAT.PDF ? (
    <a
      className="flex h-full items-center gap-4 rounded-xl bg-[#20382a] p-4 hover:bg-[#294735]"
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content}
    </a>
  ) : (
    <button
      className="flex h-full w-full items-center gap-4 rounded-xl bg-[#20382a] p-4 text-left hover:bg-[#294735] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#c3f5a0]"
      aria-label={entry.name}
      onClick={() => onOpen(entry)}
    >
      {content}
    </button>
  );
}

export function FileList(props: { files: DirectoryEntry[]; hasQuery: boolean }) {
  const { files, hasQuery } = props;
  const [selected, setSelected] = useState<Extract<DirectoryEntry, { kind: "file" }> | null>(null);

  return (
    <section className="mt-8" aria-labelledby="files-heading">
      <h2 className="mb-4 text-lg leading-normal font-semibold" id="files-heading">
        Files{" "}
        <span className="ml-2 text-sm leading-normal font-normal text-[#9eafa3]">
          {files.length}
        </span>
      </h2>
      {files.length === 0 ? (
        <p className="text-[#9eafa3]">
          {hasQuery ? "一致するファイルはありません。" : "ファイルはありません。"}
        </p>
      ) : (
        <ul className="grid list-none grid-cols-2 gap-2 p-0 max-[560px]:grid-cols-1">
          {files.map(
            (entry) =>
              entry.kind === "file" && (
                <li className="min-w-0" key={entry.path}>
                  <FileCard entry={entry} onOpen={setSelected} />
                </li>
              ),
          )}
        </ul>
      )}
      {selected && <MediaViewer entry={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
