import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { FILE_FORMAT, type DirectoryEntry } from "@s/directory";

export function MediaViewer(props: {
  entry: Extract<DirectoryEntry, { kind: "file" }>;
  onClose: () => void;
  onPrevious: (() => void) | undefined;
  onNext: (() => void) | undefined;
}) {
  const { entry, onClose, onPrevious, onNext } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const fileUrl = `/api/files?path=${encodeURIComponent(entry.path)}`;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-label={entry.name}
      className="m-auto max-h-[100dvh] max-w-full rounded-xl bg-[#101713] p-4 text-[#edf3ef] backdrop:bg-black/80"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="min-w-0 [overflow-wrap:anywhere]">{entry.name}</h2>
        <button
          className="shrink-0 rounded-lg bg-[#294735] px-4 py-2"
          onClick={() => dialog.current?.close()}
        >
          閉じる
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="前のメディア"
          disabled={!onPrevious}
          onClick={onPrevious}
          className="shrink-0 rounded-lg bg-[#294735] p-2 disabled:opacity-30"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="min-w-0">
          {entry.format === FILE_FORMAT.WEBM ? (
            <video
              key={entry.path}
              className="max-h-[80dvh] max-w-full"
              src={fileUrl}
              controls
              preload="metadata"
            />
          ) : (
            <img
              className="max-h-[80dvh] max-w-full object-contain"
              src={fileUrl}
              alt={entry.name}
            />
          )}
        </div>
        <button
          aria-label="次のメディア"
          disabled={!onNext}
          onClick={onNext}
          className="shrink-0 rounded-lg bg-[#294735] p-2 disabled:opacity-30"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </dialog>
  );
}
