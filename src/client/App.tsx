import { ArrowUp, ArrowUpRight, Folder } from "lucide-react";
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
  const { path, entries } = useLoaderData<typeof directoryLoader>();
  const navigation = useNavigation();

  const directories = entries.filter((entry) => entry.kind === "directory");
  const files = entries.filter((entry) => entry.kind === "file");
  const parentPath = path.split("/").slice(0, -1).join("/");
  const directoryUrl = (value: string) =>
    value ? `/?${new URLSearchParams({ path: value })}` : "/";

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
      </header>
      {navigation.state !== "idle" && <DirectoryLoading />}
      {entries.length === 0 && <p>このディレクトリは空です。</p>}
      <section className="mt-8" aria-labelledby="directories-heading">
        <h2 className="mb-4 text-lg leading-normal font-semibold" id="directories-heading">
          Directories{" "}
          <span className="ml-2 text-sm leading-normal font-normal text-[#9eafa3]">
            {directories.length}
          </span>
        </h2>
        {directories.length === 0 ? (
          <p className="text-[#9eafa3]">フォルダはありません。</p>
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
          <p className="text-[#9eafa3]">ファイルはありません。</p>
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
