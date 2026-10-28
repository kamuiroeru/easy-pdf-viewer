const FAILURE_KIND = {
  INVALID: "invalid",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
} as const;

export type FailureKind = (typeof FAILURE_KIND)[keyof typeof FAILURE_KIND];
export type Failure = {
  readonly code: string;
  readonly kind: FailureKind;
  readonly message: string;
};

export const FAILURE = {
  INVALID_PATH: {
    code: "INVALID_PATH",
    kind: FAILURE_KIND.INVALID,
    message: "パスが正しくありません",
  },
  NOT_DIRECTORY: {
    code: "NOT_DIRECTORY",
    kind: FAILURE_KIND.INVALID,
    message: "ディレクトリではありません",
  },
  FORBIDDEN: { code: "FORBIDDEN", kind: FAILURE_KIND.FORBIDDEN, message: "アクセスできません" },
  NOT_FOUND: { code: "NOT_FOUND", kind: FAILURE_KIND.NOT_FOUND, message: "対象が見つかりません" },
} as const satisfies Record<string, Failure>;
