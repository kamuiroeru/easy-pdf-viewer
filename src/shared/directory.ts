export const FILE_FORMAT = {
  PDF: "pdf",
  GIF: "gif",
  WEBM: "webm",
  PNG: "png",
  JPEG: "jpeg",
} as const;

export type FileFormat = (typeof FILE_FORMAT)[keyof typeof FILE_FORMAT];

const ENTRY_KIND = {
  DIRECTORY: "directory",
  FILE: "file",
} as const;

type EntryBase = {
  name: string;
  /** Unencoded path relative to the content root, separated by `/`. */
  path: string;
};

export type DirectoryEntry = EntryBase &
  ({ kind: typeof ENTRY_KIND.DIRECTORY } | { kind: typeof ENTRY_KIND.FILE; format: FileFormat });
