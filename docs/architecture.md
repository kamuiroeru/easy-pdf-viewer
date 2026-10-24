# アーキテクチャ

## 採用する構成

- バックエンド: Hono + Node.js
- フロントエンド: React + Vite + TypeScript
- 開発ツールチェーン: Vite+ (`vp`)
- 画面ルーティング: React Router の Data Mode
- サムネイルキャッシュ: Redis
- リポジトリ: 一つの `package.json` で管理し、workspaces は導入しない

## ディレクトリ構成

アプリケーションのコードは以下の構成で配置する。

```text
docs/
src/
  client/
    public/
    assets/
    components/
    routes/
    index.html
    main.tsx
    tsconfig.json
  server/
    routes/
    services/
    tsconfig.json
  shared/
    tsconfig.json
vite.config.ts
tsconfig.json
package.json
compose.yaml
```

| ディレクトリ          | 責務                                                   |
| --------------------- | ------------------------------------------------------ |
| `src/client`          | 一覧、画面遷移、拡大ビューア、ブラウザ内の状態管理     |
| `src/server/routes`   | HTTP API、認証の適用、ファイル配信の入口               |
| `src/server/services` | ファイル探索、パス検証、サムネイル取得、キャッシュ処理 |
| `src/shared`          | クライアントとサーバーで共有する型・スキーマ           |

クライアントからサーバーの実装を直接 import しない。Hono RPC 用の型を参照する場合は `import type` を使い、サーバーの実装をブラウザのバンドルに含めない。

Vite のルートは `src/client` とし、加工せず配信する静的ファイルは `src/client/public`、import して使用する画像などは `src/client/assets` に置く。フロントエンドのビルド出力は `dist/client` に配置する。閲覧対象の PDF・画像・動画は `public` に置かず、サーバーから配信する。

## ディレクトリ一覧と絞り込み

`src/server/services/directoryListing.ts` の `listDirectory(path, root)` が、公開ルートからの相対パスを受け取り、既存の `resolvePublicPath` で検証してから直下の項目を読み取る。`path` の既定値は空文字列、`root` の既定値は `CONTENT_ROOT` とする。読み取りエラーは呼び出し元へ伝える。

共有型 `DirectoryEntry` は `src/shared/directory.ts` に定義する。各項目は名前 `name`、公開ルート基準の相対パス `path`、種類 `kind` を持つ。パスの区切りには `/` を使い、URL エンコードは行わない。種類は `directory`・`pdf`・`gif`・`webm`・`png`・`jpeg` とし、`.jpg` と `.jpeg` はともに `jpeg` とする。リンクを含むディレクトリを指定した場合も、返すパスには指定時の相対パスを使う。

拡張子は最後の拡張子を小文字にして判定する。一覧はフォルダを先に並べ、それぞれ名前を JavaScript の文字列比較で昇順にする。ロケールによる並び順の違いを避けるため、UTF-16 コード単位順を使う。シンボリックリンクは参照先をたどらず一覧から除外する。

一覧 API は現在のディレクトリの全項目を返す。検索欄への入力に応じて、フロントエンドで取得済みの一覧をフォルダ名・ファイル名で絞り込む。絞り込みのための API リクエストは送信しない。

## 開発・本番の起動方針

開発時は Vite と Hono を並行起動し、API・コンテンツへのリクエストを Vite から Hono にプロキシする。本番は Hono からビルド済みフロントエンドも配信し、同一オリジンで提供する。

アプリと Redis を Docker Compose で運用する案を基本とする。具体的な配置と起動コマンドは運用環境を決めてから確定する。

## 詳細設計の初期案

以下は実装前に詰める案であり、確定仕様ではない。

- PDF はブラウザ標準ビューアで開き、表示要件が増えたら PDF.js を検討する。
- PDF・動画は HTTP Range リクエストに対応した配信を行う。
- サムネイルは Redis に存在すれば返し、なければ JPG を読み、キャッシュする。Redis 障害時は元ファイルから配信する。
- キャッシュの更新判定には JPG の相対パス・更新日時・サイズを使い、TTL とメモリ上限を設定する。
- スクロール位置はディレクトリと並び順をキーに localStorage へ保存する。端末間同期が必要になったら永続化 API を検討する。
- Basic 認証は一覧 API とすべてのコンテンツ配信に適用する。
- ファイルアクセスは実パスを検証し、シンボリックリンクを含めて公開ルート外へのアクセスを防ぐ。
- 将来のネイティブアプリからも使用できる HTTP API とし、Web UI 固有の処理をファイル探索処理に持ち込まない。
