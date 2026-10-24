import { ArrowUpRight, Folder } from "lucide-react";
import { Link } from "react-router";
import { directoryUrl } from "./directoryUrl";
import type { DirectoryEntry } from "@s/directory";

export function DirectoryList({
  directories,
  hasQuery,
}: {
  directories: DirectoryEntry[];
  hasQuery: boolean;
}) {
  return (
    <section className="mt-8" aria-labelledby="directories-heading">
      <h2 className="mb-4 text-lg leading-normal font-semibold" id="directories-heading">
        Directories{" "}
        <span className="ml-2 text-sm leading-normal font-normal text-[#9eafa3]">
          {directories.length}
        </span>
      </h2>
      {directories.length === 0 ? (
        <p className="text-[#9eafa3]">
          {hasQuery ? "一致するフォルダはありません。" : "フォルダはありません。"}
        </p>
      ) : (
        <ul className="grid list-none grid-cols-2 gap-2 p-0">
          {directories.map((entry) => (
            <li className="min-w-0" key={entry.path}>
              <Link
                className="flex h-full min-h-9 items-center gap-2 rounded-lg bg-[#a5cf86] px-3 py-2 text-xs leading-normal font-semibold [overflow-wrap:anywhere] text-[#182b19] hover:bg-[#b4df94]"
                to={directoryUrl(entry.path)}
              >
                <Folder className="size-4 shrink-0" aria-hidden="true" strokeWidth="1.5" />
                <span className="min-w-0">{entry.name}/</span>
                <ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
