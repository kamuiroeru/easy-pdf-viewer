---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript の import

- `.ts`・`.tsx` ファイルを作成・編集する際は、リポジトリルートの `tsconfig.paths.json` の `compilerOptions.paths` を確認する。
- 定義済みの alias で参照できる内部モジュールは、相対パスより alias を優先する。型の import・再エクスポートにも同じルールを適用する。
- alias の定義元は `tsconfig.paths.json` とし、未定義の alias を推測して使用しない。
- alias が定義されていない参照には相対パスを使用する。
