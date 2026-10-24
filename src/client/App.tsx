import { ArrowUp, ArrowUpRight, Folder } from "lucide-react";
import { memo, useDeferredValue, useMemo, useState } from "react";
import { Link, useLoaderData, useNavigation } from "react-router";
import type { directoryLoader } from "./router";

export function DirectoryLoading() {
  return <p role="status">ディレクトリを読み込み中…</p>;
}

export function DirectoryError() {
  return (
    <main className="p-6 text-left">
      <p role="alert">ディレクトリの取得に失敗しました。</p>
      <Link to="/">ルートへ戻る</Link>
    </main>
  );
}

export default function App() {
  const data = useLoaderData<typeof directoryLoader>();
  return <Directory key={data.path} {...data} />;
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

function Directory({ path, entries }: Awaited<ReturnType<typeof directoryLoader>>) {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const parentPath = path.split("/").slice(0, -1).join("/");

  return (
    <main
      className="mx-auto max-w-[1120px] px-6 pt-10 pb-[calc(112px+env(safe-area-inset-bottom,0px))] max-[560px]:px-4 max-[560px]:pt-6"
      aria-busy={navigation.state !== "idle"}
    >
      <header className="border-b border-[#2a3930] pb-7">
        <h1 className="mb-3 text-sm leading-normal font-medium text-[#a6b8ac]">Easy PDF Viewer</h1>
        <p className="text-2xl leading-normal font-semibold [overflow-wrap:anywhere] max-[560px]:text-xl">
          現在のディレクトリ: /{path}
        </p>
        <label className="mt-5 block text-sm text-[#a6b8ac]" htmlFor="directory-search">
          フォルダ名・ファイル名を検索
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-[#52685a] bg-[#20382a] px-3 py-2 text-base text-[#e4eee7] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#a5cf86]"
          id="directory-search"
          type="search"
          placeholder="現在のディレクトリ内を検索"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {navigation.state !== "idle" && <DirectoryLoading />}
      {entries.length === 0 && <p>このディレクトリは空です。</p>}
      <div aria-busy={query !== deferredQuery}>
        <DirectoryResults entries={entries} query={deferredQuery} />
      </div>
      {path && (
        <Link
          className="fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-[calc(16px+env(safe-area-inset-left,0px))] z-10 inline-flex min-h-14 items-center gap-2.5 rounded-full border border-[#b4df94] bg-[#a5cf86] px-5 py-3 font-semibold text-[#182b19] shadow-[0_4px_20px_#0006] hover:bg-[#b4df94]"
          aria-label="親ディレクトリへ戻る"
          to={directoryUrl(parentPath)}
        >
          <ArrowUp className="size-4 shrink-0" aria-hidden="true" />
          <span>親へ戻る</span>
        </Link>
      )}
    </main>
  );
}

function directoryUrl(value: string) {
  return value ? `/?${new URLSearchParams({ path: value })}` : "/";
}

const DirectoryResults = memo(function DirectoryResults({
  entries,
  query,
}: {
  entries: Awaited<ReturnType<typeof directoryLoader>>["entries"];
  query: string;
}) {
  const searchableEntries = useMemo(
    () => entries.map((entry) => ({ entry, searchName: normalizeSearch(entry.name) })),
    [entries],
  );
  const normalizedQuery = normalizeSearch(query);
  const matchingEntries = searchableEntries
    .filter(({ searchName }) => searchName.includes(normalizedQuery))
    .map(({ entry }) => entry);
  const directories = matchingEntries.filter((entry) => entry.kind === "directory");
  const files = matchingEntries.filter((entry) => entry.kind === "file");

  return (
    <>
      <section className="mt-8" aria-labelledby="directories-heading">
        <h2 className="mb-4 text-lg leading-normal font-semibold" id="directories-heading">
          Directories{" "}
          <span className="ml-2 text-sm leading-normal font-normal text-[#9eafa3]">
            {directories.length}
          </span>
        </h2>
        {directories.length === 0 ? (
          <p className="text-[#9eafa3]">
            {query ? "一致するフォルダはありません。" : "フォルダはありません。"}
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
      <section className="mt-8" aria-labelledby="files-heading">
        <h2 className="mb-4 text-lg leading-normal font-semibold" id="files-heading">
          Files{" "}
          <span className="ml-2 text-sm leading-normal font-normal text-[#9eafa3]">
            {files.length}
          </span>
        </h2>
        {files.length === 0 ? (
          <p className="text-[#9eafa3]">
            {query ? "一致するファイルはありません。" : "ファイルはありません。"}
          </p>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-2 p-0">
            {files.map((entry) => (
              <li
                className="min-h-24 min-w-0 rounded-xl bg-[#20382a] p-6 [overflow-wrap:anywhere] max-[560px]:p-4"
                key={entry.path}
              >
                {entry.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
});
