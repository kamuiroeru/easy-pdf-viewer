export type FileFormat = "pdf" | "gif" | "webm" | "png" | "jpeg";

type EntryBase = {
  name: string;
  /** Unencoded path relative to the content root, separated by `/`. */
  path: string;
};

export type DirectoryEntry = EntryBase &
  ({ kind: "directory" } | { kind: "file"; format: FileFormat });
