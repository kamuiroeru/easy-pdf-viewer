---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript の列挙用定数

- 列挙値を定義する場合は、`enum`・`const enum` ではなく `as const` を付けたオブジェクトを使う。
- 列挙用オブジェクトの名前とキーは `UPPER_SNAKE_CASE` にする（例: `BYTE_RANGE_TYPE.PARTIAL`）。
- 値の union 型はオブジェクトから導出し、文字列リテラルを別途列挙しない。
- キーの命名と文字列の値は区別する。値は用途に適した表記を使い、既存の値を命名変更に合わせて変更しない。

```ts
export const BYTE_RANGE_TYPE = {
  PARTIAL: "partial",
  UNSATISFIABLE: "unsatisfiable",
  IGNORE: "ignore",
} as const;

export type ByteRangeType = (typeof BYTE_RANGE_TYPE)[keyof typeof BYTE_RANGE_TYPE];
```
