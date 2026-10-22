# Easy PDF Viewer

ローカルディレクトリの PDF・画像・動画を閲覧する Web アプリ。

設計と要件は [docs](docs/README.md) に記録します。

## テスト

Vite+ 同梱の Vitest を使用します。API は `vite-plus/test` から明示的に import します。

- `vp test`: 全テストを1回実行
- `vp test watch`: watch モード
- `vp test tests/unit/typescript.test.ts`: ファイルを指定して実行
- `vp check` / `vp run typecheck`: テストを含む静的チェック

pure TS の UT は Node 環境で実行します。`src/**/*.test.ts` に対象コードと並べるか、
`tests/**/*.test.ts` に配置してください。`tests/unit/typescript.test.ts` は実行環境のスモークテストです。
CI でも `vp test` を実行し、テストが見つからない場合は失敗します。
