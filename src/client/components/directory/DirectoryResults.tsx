import { memo, useMemo } from "react";
import type { DirectoryEntry } from "@s/directory";
import { DirectoryList } from "./DirectoryList";
import { FileList } from "./FileList";

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

export const DirectoryResults = memo(function DirectoryResults({
  entries,
  query,
}: {
  entries: DirectoryEntry[];
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
      <DirectoryList directories={directories} hasQuery={Boolean(query)} />
      <FileList files={files} hasQuery={Boolean(query)} />
    </>
  );
});
