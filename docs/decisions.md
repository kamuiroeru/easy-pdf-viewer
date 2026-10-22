# 設計判断

## 2026-10-22: Vite+ で開発ツールを管理

状態: 採用

Vite、Vitest、Oxlint、Oxfmt などを Vite+ (`vp`) でまとめて管理する。プロジェクトローカルの `vite-plus` を pnpm でインストールし、Vite+ 1.3.0 を初期バージョンとする。

React + TypeScript の Vite テンプレートを `vp create` で生成し、Vite+ の設定を引き継ぐ。既存の単一 package 構成を保ち、pnpm の catalog は Vite+ が要求する依存バージョン管理に使用する。

`pnpm-workspace.yaml` は catalog などの pnpm 設定に使用する。複数パッケージを管理するための `packages` は定義しない。

## 2026-10-22: Hono + React の構成を採用

状態: 採用

バックエンドに Hono + Node.js、フロントエンドに React + Vite + TypeScript、画面ルーティングに React Router の Data Mode、サムネイルキャッシュに Redis を使用する。

一覧操作、拡大表示、前後移動、スクロール復元といったブラウザ内の操作が中心で、現時点では SSR の必要性が低い。慣れている TSX を活かし、将来の Android・iOS 向け API も Hono で提供できる構成にする。

HonoX も候補に挙げたが、今回の要件では採用しない。Next.js はユーザーの方針により使用しない。

## 2026-10-22: workspaces を導入せずに開始

状態: 採用

一つの `package.json` で管理し、`src/client`・`src/server`・`src/shared` で責務を分ける。

現時点で独立したパッケージとして管理する対象がないため、monorepo 用の構成やツールは追加しない。将来、Expo アプリなどを同じリポジトリに置き、コードをパッケージとして共有する必要が生じたら再検討する。

## 2026-10-22: 設計を docs に記録

状態: 採用

要件と設計を相談しながら進め、合意事項・未決定事項・判断理由を `docs` に残す。現在の仕様と判断の履歴を分けて管理する。
