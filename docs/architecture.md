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

## API のエラー処理方針

呼び出し元が失敗の種類に応じて処理を変える場合は、想定内の失敗として値を返す。サービス層では成功と失敗を区別できる Result を使い、失敗には識別用の code、種類、メッセージを持たせる。HTTP ステータスはサービス層に持ち込まず、ルート側で失敗の種類から応答に変換する。種類とステータスの対応は一箇所で管理する。

ルートハンドラーは想定内の失敗を応答として return し、成功時もステータスを明示する。これにより Hono RPC の応答型にステータスと失敗の情報を含め、クライアントがステータスで型を絞り込めるようにする。

エラー応答の形式は `{ error: { code, message } }` とし、入力検証などハンドラーの外で起きる失敗も揃える。検証フックから return した応答は RPC の型に含められるが、throw して `onError` で処理した応答はハンドラーの戻り値の型には含まれない。ルートが存在しない場合は `notFound` で扱う。

想定外の例外は `onError` でログに記録し、内部情報を含めない 500 応答を返す。エラー応答の組み立ては共通化する。

Range を満たせない場合は HTTP Range の仕様に従い、本文のない 416 応答を返す。

## 一覧画面のルーティングとデータ取得

一覧画面は React Router の Data Mode を使う。ルートディレクトリの URL は `/`、子ディレクトリは `/?path=<URL エンコードした相対パス>` とする。クエリでパスを表すため、拡張子を含むディレクトリ名も静的ファイルの URL と区別できる。

loader は URL の `path` を読み取り、Hono RPC で一覧 API を呼ぶ。リクエストには React Router の中断シグナルを渡す。データ取得と画面遷移の状態は React Router で管理し、SWR・TanStack Query は追加しない。

初回の読み込みは `HydrateFallback`、移動中は `useNavigation` で読み込み表示を出す。HTTP エラーと通信エラーはルートの `ErrorBoundary` で表示する。取得に成功して一覧が空の場合は、空ディレクトリのメッセージを表示する。

## ディレクトリ一覧と絞り込み

`src/server/services/directoryListing.ts` の `listDirectory(path, root)` が、公開ルートからの相対パスを受け取り、既存の `resolvePublicPath` で検証してから直下の項目を読み取る。`path` の既定値は空文字列、`root` の既定値は `CONTENT_ROOT` とする。`listDirectoryResult` は想定内の読み取りエラーを失敗の値に変換し、想定外のエラーは呼び出し元へ伝える。

共有型 `DirectoryEntry` は `src/shared/directory.ts` に定義する。各項目は名前 `name`、公開ルート基準の相対パス `path`、種類 `kind` を持つ。パスの区切りには `/` を使い、URL エンコードは行わない。種類 `kind` は `directory` または `file` とする。`file` の場合だけ形式 `format` を必須とし、値は `pdf`・`gif`・`webm`・`png`・`jpeg` とする。`.jpg` と `.jpeg` はともに `jpeg` とする。ファイルシステム上の種類とファイル形式を分けるため、共有型は `kind` を判別子とする union で表す。リンクを含むディレクトリを指定した場合も、返すパスには指定時の相対パスを使う。

拡張子は最後の拡張子を小文字にして判定する。一覧はフォルダを先に並べ、それぞれ名前を JavaScript の文字列比較で昇順にする。ロケールによる並び順の違いを避けるため、UTF-16 コード単位順を使う。シンボリックリンクは参照先をたどらず一覧から除外する。

一覧 API は現在のディレクトリの全項目を返す。検索欄への入力に応じて、フロントエンドで取得済みの一覧をフォルダ名・ファイル名で絞り込む。絞り込みのための API リクエストは送信しない。

## ファイル配信と HTTP Range

`GET /api/files?path=<URL エンコードした相対パス>` は、公開対象のファイルをストリームで配信する。PDF・WebM・画像に共通して `Accept-Ranges: bytes` を返す。

- 単一の byte Range（`bytes=start-end`、`bytes=start-`、`bytes=-suffixLength`）には 206 を返し、`Content-Range` と配信するバイト数の `Content-Length` を設定する。終端がファイル末尾を超えた場合は末尾まで、末尾指定の長さがファイルサイズを超えた場合は全バイトを返す。
- 開始位置がファイルサイズ以上、末尾指定の長さが 0、空ファイルに対する有効な Range は 416 とし、`Content-Range: bytes */<ファイルサイズ>` と `Content-Length: 0` を返す。
- Range なし、不正な形式（開始位置が終端より大きい場合を含む）、複数 Range、bytes 以外の単位は、ファイル全体を 200 で返す。`Content-Length` はファイルサイズとし、`Content-Range` は付けない。
- ETag・Last-Modified による検証は行わず、`If-Range` がある場合は Range を無視して全体を 200 で返す。

## PDF サムネイルの配信

`GET /api/thumbnails?path=<URL エンコードした PDF の相対パス>` は、`THUMBNAIL_ROOT` 内の対応する JPG を配信する。PDF の相対パスの末尾 `.pdf`（大文字・小文字を区別しない）を小文字 `.jpg` に置き換え、ディレクトリ構造とそれ以外の名前はそのまま使う。例: `資料/book.PDF` は `THUMBNAIL_ROOT/資料/book.jpg` に対応する。PDF 本体の存在確認は行わない。

一覧の `kind === "file"` かつ `format === "pdf"` の項目から、`"/api/thumbnails?path=" + encodeURIComponent(entry.path)` で URL を組み立てる。パスは一度だけ URL デコードする。

- 成功時は 200 と JPG の全バイトを返し、`Content-Type: image/jpeg`、ファイルサイズの `Content-Length`、`X-Content-Type-Options: nosniff` を設定する。
- `path` の省略・空文字・重複、PDF 以外の拡張子は 400 `{ "error": { "code": "INVALID_PATH", "message": "パスが正しくありません" } }` とする。
- JPG が存在しない場合は 404 `{ "error": { "code": "NOT_FOUND", "message": "対象が見つかりません" } }` とする。代替画像は返さない。
- 絶対パス、`..`、NUL、ルート外を指すシンボリックリンク、ディレクトリ、実体の拡張子が `.jpg` 以外のリンクは 403 `{ "error": { "code": "FORBIDDEN", "message": "アクセスできません" } }` とする。読み取り権限がない場合も 403 とし、その他の読み取りエラーは 500 `{ "error": { "code": "INTERNAL_ERROR", "message": "サーバーでエラーが起きました" } }` とする。

## 開発・本番の起動方針

開発時は Vite と Hono を並行起動し、API・コンテンツへのリクエストを Vite から Hono にプロキシする。本番は Hono からビルド済みフロントエンドも配信し、同一オリジンで提供する。

アプリと Redis を Docker Compose で運用する案を基本とする。具体的な配置と起動コマンドは運用環境を決めてから確定する。

## 詳細設計の初期案

以下は実装前に詰める案であり、確定仕様ではない。

- PDF はブラウザ標準ビューアで開き、表示要件が増えたら PDF.js を検討する。
- サムネイルは Redis に存在すれば返し、なければ JPG を読み、キャッシュする。Redis 障害時は元ファイルから配信する。
- キャッシュの更新判定には JPG の相対パス・更新日時・サイズを使い、TTL とメモリ上限を設定する。
- スクロール位置はディレクトリと並び順をキーに localStorage へ保存する。端末間同期が必要になったら永続化 API を検討する。
- Basic 認証は一覧 API とすべてのコンテンツ配信に適用する。
- ファイルアクセスは実パスを検証し、シンボリックリンクを含めて公開ルート外へのアクセスを防ぐ。
- 将来のネイティブアプリからも使用できる HTTP API とし、Web UI 固有の処理をファイル探索処理に持ち込まない。
