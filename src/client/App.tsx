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

  return (
    <main className="p-6 text-left" aria-busy={navigation.state !== "idle"}>
      <h1>Easy PDF Viewer</h1>
      <p>現在のディレクトリ: /{path}</p>
      {path && <Link to="/">ルートへ戻る</Link>}
      {navigation.state !== "idle" && <DirectoryLoading />}
      {entries.length === 0 ? (
        <p>このディレクトリは空です。</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.path}>
              {entry.kind === "directory" ? (
                <Link to={`/?${new URLSearchParams({ path: entry.path })}`}>{entry.name}/</Link>
              ) : (
                entry.name
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
