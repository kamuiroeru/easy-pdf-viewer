import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Failure = {
  readonly code: string;
  readonly status: ContentfulStatusCode;
  readonly message: string;
};

export const FAILURE = {
  INVALID_PATH: {
    code: "INVALID_PATH",
    status: 400,
    message: "パスが正しくありません",
  },
  NOT_DIRECTORY: {
    code: "NOT_DIRECTORY",
    status: 400,
    message: "ディレクトリではありません",
  },
  FORBIDDEN: { code: "FORBIDDEN", status: 403, message: "アクセスできません" },
  NOT_FOUND: { code: "NOT_FOUND", status: 404, message: "対象が見つかりません" },
} as const satisfies Record<string, Failure>;
