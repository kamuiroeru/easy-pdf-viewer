import { useDeferredValue, useState } from "react";
import { Link, useLoaderData, useNavigation } from "react-router";
import type { directoryLoader } from "./router";
import { DirectoryHeader } from "@fe/components/directory/DirectoryHeader";
import { DirectoryResults } from "@fe/components/directory/DirectoryResults";
import { ParentDirectoryLink } from "@fe/components/directory/ParentDirectoryLink";

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

function Directory({ path, entries }: Awaited<ReturnType<typeof directoryLoader>>) {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  return (
    <main
      className="mx-auto max-w-[1120px] px-6 pt-10 pb-[calc(112px+env(safe-area-inset-bottom,0px))] max-[560px]:px-4 max-[560px]:pt-6"
      aria-busy={navigation.state !== "idle"}
    >
      <DirectoryHeader path={path} query={query} onQueryChange={setQuery} />
      {navigation.state !== "idle" && <DirectoryLoading />}
      {entries.length === 0 && <p>このディレクトリは空です。</p>}
      <div aria-busy={query !== deferredQuery}>
        <DirectoryResults entries={entries} query={deferredQuery} />
      </div>
      {path && <ParentDirectoryLink path={path} />}
    </main>
  );
}
