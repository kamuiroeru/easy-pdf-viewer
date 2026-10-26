---
paths:
  - "**/*.tsx"
---

# React コンポーネントの props

- props を受け取るコンポーネントは、引数名を `props` とし、引数の位置で分割代入しない。
- props の型は、引数の型注釈にオブジェクト型として直接定義する。props の型定義だけを目的とした `type` や `interface` は作らない。
- コンポーネント本体で、使用するプロパティだけを `const { ... } = props` で取り出す。
- `memo` などでラップするコンポーネントにも同じ形式を使う。
- 他の場所でコンポーネントの props 型を再利用する場合は、React の `ComponentProps<typeof 対象コンポーネント>` から取得する。再利用のために props 型を別途定義・エクスポートしない。

```tsx
function Hoge(props: { a: string; b: number; description?: string }) {
  const { a, b } = props;

  return (
    <p>
      {a}: {b}
    </p>
  );
}
```

props 型を再利用する例:

```tsx
import type { ComponentProps } from "react";

type HogeProps = ComponentProps<typeof Hoge>;
type HogeLabel = ComponentProps<typeof Hoge>["a"];
```
