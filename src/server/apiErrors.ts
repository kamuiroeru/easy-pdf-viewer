import type { Context, ErrorHandler, NotFoundHandler, TypedResponse } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Failure, FailureKind } from "@be/services/failures.ts";

const FAILURE_STATUS = {
  invalid: 400,
  forbidden: 403,
  notFound: 404,
} as const satisfies Record<FailureKind, number>;

function errorBody<C extends string>(
  code: C,
  message: string,
): { error: { code: C; message: string } } {
  return { error: { code, message } };
}

type FailureResponse<F extends Failure> = F extends Failure
  ? Response &
      TypedResponse<
        { error: { code: F["code"]; message: string } },
        (typeof FAILURE_STATUS)[F["kind"]],
        "json"
      >
  : never;

export function failureResponse<F extends Failure>(c: Context, failure: F): FailureResponse<F> {
  return c.json(
    errorBody(failure.code, failure.message),
    FAILURE_STATUS[failure.kind],
  ) as FailureResponse<F>;
}

export const onError: ErrorHandler = (error, c) => {
  if (error instanceof HTTPException) {
    return c.json(errorBody("HTTP_ERROR", error.message), error.status);
  }
  console.error(error);
  return c.json(errorBody("INTERNAL_ERROR", "サーバーでエラーが起きました"), 500);
};

export const notFound: NotFoundHandler = (c) =>
  c.json(errorBody("ROUTE_NOT_FOUND", "ルートが見つかりません"), 404);
