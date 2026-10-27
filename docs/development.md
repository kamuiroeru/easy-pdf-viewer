# 開発ガイド

## セットアップと起動

1. `vp install` で依存パッケージをインストールします。
2. `.env.example` を `.env` にコピーし、`CONTENT_ROOT` と `THUMBNAIL_ROOT` を設定します。相対パスは作業ディレクトリを基準に解決されます。既定の設定では同梱の `_dummy-assets` を使用できます。
3. `vp run dev` でクライアントと API を起動し、Vite が表示する URL（通常 `http://localhost:5173`）を開きます。

クライアントと API はそれぞれ `vp run dev:client`、`vp run dev:server` で個別に起動できます。

ビルドしたアプリを実行するには、`vp run build` のあとに `vp run start` を実行し、`http://127.0.0.1:3000` を開きます。`vp run preview` はクライアントのみのプレビューです。

## テストと静的チェック

- `vp test`: 全テストを1回実行
- `vp test watch`: watch モードで実行
- `vp test <ファイルパス>`: 指定したファイルを実行
- `vp test --project unit`: Node 環境のテストを実行
- `vp test --project component`: jsdom 環境のコンポーネントテストを実行
- `vp check`: フォーマット、lint、型チェックを実行
- `vp run typecheck`: 型チェックを実行

テストは対象コードと同じ場所の `src/**/*.test.ts`、`src/**/*.test.tsx`、または `tests/**/*.test.ts` に配置します。jsdom では実ブラウザーのレイアウトや描画は検証できません。

構成と設計方針は [アーキテクチャ](architecture.md) を参照してください。
