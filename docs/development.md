# 開発ガイド

## セットアップと起動

`vp install` のあと、`.env.example` を `.env` にコピーし、公開対象とサムネイルのパスを設定します。
`vp run dev` でクライアントと API を同時に起動します。
`concurrently` を使い、Ctrl+C または片方の終了時には両方を停止します。
Vite が表示する URL（通常 `http://localhost:5173`）を開いてください。
`.env.example` の既定パスでは、同梱の `_dummy-assets` を使って動作確認できます。
ルートの複数フォルダ・PDF・画像で2列表示を確認し、`01 ガイド` で階層移動、
`日本語 空白/子 # & +` で日本語・空白・記号を含むパス、`空のフォルダ` で空表示を確認できます。
子フォルダでは左下の「親へ戻る」とブラウザの戻る操作を確認してください。
PDF に対応するサムネイルは `thumbnails` 以下の同じ相対パスに配置しています。
空フォルダの保持に使う `.gitkeep` は一覧には表示されません。

個別に起動することもできます。

- `vp run dev:server`: Hono API を `http://127.0.0.1:3000` で起動（変更時に再起動）
- `vp run dev:client`: Vite のクライアントを起動

`GET /api/hello` は `{ "message": "Hello from Hono!" }` を返します。
クライアントは Hono RPC (`hono/client`) を使って API にアクセスします。
Vite の dev / preview は `/api` を API サーバーへプロキシします。
`vp run build` のあと、`vp run start` で Hono から `dist/client` と API を配信します。
`http://127.0.0.1:3000` を開いてください。server はプロジェクト指定の Node.js で
TypeScript を直接実行します。`vp run preview` はクライアントのみのプレビューです。

server の起動口は `src/server/index.ts` に統一し、環境変数 `APP_ENV` で切り替えます。
`vp run dev`（`dev:server`）は `APP_ENV=dev`、`vp run start` は `APP_ENV=prod` を設定します。
`dev` は API のみ、`prod` は API とビルド済みクライアントを配信します。
`APP_ENV` の未指定時は `dev` となり、`dev`・`prod` 以外は起動時の検証で拒否します。

公開対象のルートは `.env` の `CONTENT_ROOT`、PDF サムネイルのルートは
`THUMBNAIL_ROOT` で明示指定します。両方とも必須で、未指定・空文字は起動時に拒否します。
`dev:server` と `start` は Node.js の `--env-file=.env` で読み込みます。
相対指定はプロセスの作業ディレクトリが基準です。日本語・空白を含むパスは引用符で囲んで指定できます。
`.env` は Git の管理対象から除外します。
`src/server/services/publicPaths.ts` の `publicPaths.content(path)`・`publicPaths.thumbnail(path)` は、
URL デコード済みの相対パスを受け取り、ルート内の実パスを返します。日本語・空白を含むパスも使用できます。
絶対パス・親ディレクトリ参照・ルート外を指すシンボリックリンクは拒否します。
`PublicPathError.code` の `NOT_FOUND` はパスの不存在、`FORBIDDEN` はアクセス不可を表します。
起動時に両方のルートを開いて読み取れるか確認し、失敗した場合は設定名と理由を表示して起動を中止します。
パスの解決時にもルートを検証します。このサービスはパスの検証のみを行い、ファイルは配信しません。

`src/server/app.ts` の `AppType` をクライアントへ type-only import し、
レスポンス型は `InferResponseType` から導出します。手書きの共有 DTO は不要です。
Hono RPC の型推論のため、client / server の TypeScript は `strict` を有効にしています。
参考: [Hono RPC](https://hono.dev/docs/guides/rpc)。

server の起動処理は `src/server/index.ts` に分離しています。
`src/server/app.test.ts` では HTTP サーバーを起動せず `app.request()` で UT を実行します。
`src/client/api.test.ts` は RPC 経由の応答と推論型を検証します。
型アサーションは `vp run typecheck` / `vp check` で確認します。

## テスト

Vite+ 同梱の Vitest を使用します。API は `vite-plus/test` から明示的に import します。

- `vp test`: 全テストを1回実行
- `vp test watch`: watch モード
- `vp test tests/unit/typescript.test.ts`: ファイルを指定して実行
- `vp check` / `vp run typecheck`: テストを含む静的チェック

pure TS の UT は Node 環境で実行します。`src/**/*.test.ts` に対象コードと並べるか、
`tests/**/*.test.ts` に配置してください。`tests/unit/typescript.test.ts` は実行環境のスモークテストです。
CI でも `vp test` を実行し、テストが見つからない場合は失敗します。

React Component Test は `src/**/*.test.tsx` に配置し、jsdom + React Testing Library で実行します。
`userEvent.setup()` で操作を作成し、クリックなどは `await` してください。
`tests/setup-component.ts` で各テスト後に DOM を cleanup します。
`src/client/App.test.tsx` が表示・クリックの例です。

- `vp test --project unit`: pure TS の UT のみ（Node 環境）
- `vp test --project component`: Component Test のみ（jsdom 環境）

`vp test` は両方を実行します。jsdom では実ブラウザーのレイアウトや描画は検証できません。
