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
    <main className="directory-page" aria-busy={navigation.state !== "idle"}>
      <header className="directory-header">
        <h1>Easy PDF Viewer</h1>
        <p className="current-path">現在のディレクトリ: /{path}</p>
      </header>
      {navigation.state !== "idle" && <DirectoryLoading />}
      {entries.length === 0 && <p>このディレクトリは空です。</p>}
      <section aria-labelledby="directories-heading">
        <h2 id="directories-heading">
          Directories <span>{directories.length}</span>
        </h2>
        {directories.length === 0 ? (
          <p className="empty-section">フォルダはありません。</p>
        ) : (
          <ul className="entry-grid">
            {directories.map((entry) => (
              <li key={entry.path}>
                <Link className="folder-card" to={directoryUrl(entry.path)}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z" />
                  </svg>
                  <span>{entry.name}/</span>
                  <span className="folder-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="files-heading">
        <h2 id="files-heading">
          Files <span>{files.length}</span>
        </h2>
        {files.length === 0 ? (
          <p className="empty-section">ファイルはありません。</p>
        ) : (
          <ul className="entry-grid">
            {files.map((entry) => (
              <li className="file-card" key={entry.path}>
                {entry.name}
              </li>
            ))}
          </ul>
        )}
      </section>
      {path && (
        <Link
          className="parent-link"
          aria-label="親ディレクトリへ戻る"
          to={directoryUrl(parentPath)}
        >
          <span aria-hidden="true">↑</span>
          <span>親へ戻る</span>
        </Link>
      )}
    </main>
  );
}
