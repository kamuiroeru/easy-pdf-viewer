---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript の import

- `.ts`・`.tsx` ファイルを作成・編集する際は、リポジトリルートの `tsconfig.paths.json` の `compilerOptions.paths` を確認する。
- 同じディレクトリにある内部モジュールは、`./` で始まる相対パスで import する（例: `./Button`）。
- 別のディレクトリにある内部モジュールは、`@fe`（`src/client`）・`@be`（`src/server`）・`@s`（`src/shared`）の alias を使う。親ディレクトリ（`../`）や子ディレクトリ（`./components/Button`）への相対 import は使わない。
- 型の import・再エクスポートにも同じルールを適用する。
- alias の定義元は `tsconfig.paths.json` とし、未定義の alias を推測して使用しない。
- alias が定義されていない場所への参照に限り、相対パスを使用する。外部パッケージや Node.js 組み込みモジュールは通常のモジュール名で import する。
