# データ取得とメディアの遅延読み込み

調査日: 2026-10-23

状態: 議論の整理・実装方針の提案。

## 背景と前提

[要件](../requirements.md)と[アーキテクチャ](../architecture.md)を踏まえて、SWR と TanStack Query のメリット・デメリット、このアプリへの適合性を検討した。

- 初期段階はサーバーから参照できる PDF・画像・動画の閲覧が中心。
- アップロード・編集・削除は初期段階の対象に含めない。
- PDF は別タブで開き、GIF・WebM・PNG・JPEG は同じタブで拡大表示する。
- PDF のサムネイルには別のルートディレクトリに存在する JPG を使用する。
- 画面ルーティングには React Router の Data Mode を採用している。
- サムネイルのサーバー側キャッシュには Redis を使用する。

議論の中で、閲覧対象は通常変化せず、変更を反映するときはページの再読み込みを許容することを確認した。また、画面スクロールに応じて、サムネイルや JPG・PNG・WebM を動的に取得したいという希望が挙がった。

## SWR と TanStack Query の比較

どちらも API から取得したデータのキャッシュ、共有、再取得を扱うライブラリである。以下は React で使用する場合の比較であり、学習や実装の負担は今回の用途を踏まえて評価している。

| 観点               | SWR                                                                                         | TanStack Query                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 基本 API           | `useSWR(key, fetcher)` で取得する                                                           | `useQuery({ queryKey, queryFn })` で取得する                                                                |
| メリット           | 基本 API がシンプルで、データ取得を始めやすい。リクエストの重複排除や自動再検証を利用できる | クエリキーを使って関連キャッシュを管理でき、複雑な取得・更新処理を組み立てやすい                            |
| 更新処理           | `mutate`・`useSWRMutation` でキャッシュ更新、楽観的更新、エラー時の復元に対応する           | `useMutation` とキャッシュ更新・無効化を組み合わせて、更新後の再取得などを制御する                          |
| キャッシュ制御     | キーを指定したり、フィルターで複数のキーを選んだりして更新・再検証する                      | クエリキーの前方一致や完全一致などで、関連するクエリを無効化・再取得する                                    |
| 開発支援           | 比較的少ない概念で使い始められる                                                            | 専用 Devtools でクエリやミューテーションの状態を確認できる                                                  |
| デメリット・注意点 | キャッシュの関係が複雑になると、更新・再検証するキーの整理が必要になる                      | `QueryClient`、クエリキー、`staleTime`、`gcTime` などの概念が増え、単純な閲覧では設定や管理が過剰になり得る |

SWR にも更新処理や無限スクロール用の API があり、単純な読み取り専用のライブラリではない。どちらを使う場合も、データの識別に使うキーと、更新後に再取得する範囲の設計が必要になる。

自動再取得の条件にも注意する。SWR は標準でフォーカス復帰・ネットワーク再接続時などに再検証する。TanStack Query も標準では取得済みデータを stale とみなし、マウント・フォーカス復帰・再接続時などに再取得する。変化しないデータに使用する場合は、用途に合わせて設定する。

## このアプリでの提案

初期段階は SWR・TanStack Query を追加せず、React Router の loader とブラウザ標準機能で始める案が適している。

一覧情報の取得とファイルの閲覧が中心で、サーバー上のデータを更新したあとに複数画面のキャッシュの整合性を保つ必要がない。変更の反映にはページの再読み込みを使えるため、クライアント側の自動再検証も必須ではない。

| 対象                         | 提案する扱い                                              |
| ---------------------------- | --------------------------------------------------------- |
| ディレクトリの一覧情報       | React Router の loader から一覧 API を呼ぶ                |
| サムネイル・画像             | 配信 URL を `img` に指定し、遅延読み込みする              |
| PDF                          | 配信 URL をリンク先にして、別タブで開く                   |
| 動画                         | `video` で配信 URL を使い、取得開始のタイミングを制御する |
| ブラウザでのファイル再利用   | HTTP キャッシュを利用する                                 |
| サーバーでのサムネイル再利用 | 設計済みの Redis キャッシュを利用する                     |

HTTP キャッシュは `Cache-Control` や `ETag`・`Last-Modified` などで調整する。

SWR・TanStack Query が扱う API データのキャッシュ、ブラウザの HTTP キャッシュ、サーバーの Redis キャッシュはそれぞれ役割が異なる。メディアの遅延読み込みや Redis の利用だけを理由に、クエリライブラリを追加する必要はない。

## スクロールに応じたメディア取得

一覧 API ではファイル名・種類・配信 URL などの情報を返し、メディア本体は表示が近づいた時点でブラウザから取得する。この方式は、SWR・TanStack Query を使わずに実装できる。

### サムネイル・JPG・PNG

`img` の `loading="lazy"` を使うと、画面外の画像の読み込みをブラウザが遅らせる。読み込みを始める距離はブラウザに任せるため、通常は独自の scroll イベント処理を用意する必要がない。

画像の読み込みで一覧がずれてスクロール位置が変わらないよう、カードの表示領域やアスペクト比を事前に確保する。

### WebM

一覧ではポスター画像を表示し、動画本体は開いたとき、または表示が近づいたときに読み込む案がある。

`preload="none"` は先読みを抑えるためのヒントとして利用できる。ただし、ブラウザが従うことを保証する設定ではない。表示が近づくまで動画へのリクエストを開始させたくない場合は、`IntersectionObserver` で検知してから `src` を設定する。

### 読み込み開始位置の制御

`IntersectionObserver` では、要素が画面内や画面に近い範囲へ入ったことを検知できる。`rootMargin` を使えば、要素が実際に見える少し前に読み込みを始められる。

画像と動画の取得を始めるタイミングを統一して制御したい場合にも使える。

## 大量のファイルへの対応

メディア本体の遅延読み込みと、一覧情報のページ単位の取得は別の仕組み。

- メディアの遅延読み込み: 画面から遠い画像・動画の通信を遅らせる。
- 一覧のページ単位の取得: 一覧末尾が近づいたら、API から次の一覧情報を追加取得する。
- 一覧の仮想化: 表示付近の要素を描画し、DOM の要素数を抑える。

画像を遅延読み込みしても、一覧情報をすべて取得して全カードを描画する場合、一覧情報の通信量や DOM の要素数は減らない。

## 参考資料

- SWR: [API](https://swr.vercel.app/docs/api)、[自動再検証](https://swr.vercel.app/docs/revalidation)、[Mutation](https://swr.vercel.app/docs/mutation)、[ページネーション](https://swr.vercel.app/docs/pagination)
- TanStack Query: [概要](https://tanstack.com/query/latest/docs/framework/react/overview)、[クエリキー](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)、[クエリの無効化](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)、[デフォルト設定](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)、[Devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- MDN: [画像の loading 属性](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading)、[Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)、[video 要素](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)、[HTTP キャッシュ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
