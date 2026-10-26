import type { DirectoryEntry } from "@s/directory";

export function FileList(props: { files: DirectoryEntry[]; hasQuery: boolean }) {
  const { files, hasQuery } = props;

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
  );
}
