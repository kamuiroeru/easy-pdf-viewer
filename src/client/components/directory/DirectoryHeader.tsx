export function DirectoryHeader(props: {
  path: string;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const { path, query, onQueryChange } = props;

  return (
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
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </header>
  );
}
