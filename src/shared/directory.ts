export type DirectoryEntryKind = "directory" | "pdf" | "gif" | "webm" | "png" | "jpeg";

export interface DirectoryEntry {
  name: string;
  /** Unencoded path relative to the content root, separated by `/`. */
  path: string;
  kind: DirectoryEntryKind;
}
