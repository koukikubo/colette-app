# UI・予約・ダッシュボードの設計（2026-11-15）

基点 f88972b。既存AGENTS.md、development-harness、application-specification、development-environmentとcolette-design-advice / colette-ui-ux / colette-api-contractを確認。既存ハーネスやスキルは複製しない。READMEと過去の2文書の未コミット変更は保持する。

## 調査と差分

- 既存の中立色テーマはglobals.cssに集約。新規デザインシステムは作らず、既存tokenを更新する。ヘッダーは白、サイドバーは青灰、メインは淡灰、データ面は白。入力境界・キーボードフォーカスを残す。
- ログインは担当者選択とCookie/CSRF。ヘッダーのみ追加し認証経路を維持。
- サイドメニューに現在地表示がない。予約カレンダー/タイムライン、顧客管理、顧客分析、各種設定へ整理。RF画面は保持。
- /reservationsが日別タイムライン。別の予約一覧は作らない。月別カレンダーと集計APIを追加。
- ReservationRouteModalは存在するが、Issue #71で通常ページを採用し、@modal/Intercepting Routesは未接続。今回は新しいユーザー依頼を根拠にURL付きモーダルを追加する。既存URLのnew/detail/editを同じ部品で接続し、直接アクセスは通常ページを維持。
- 実席の空き枠は現在操作できない。15分単位の開始枠から日時・席をURLに渡す。現行開始時間17:00〜21:00、終了24:00までと整合させる。既存のサーバー競合検証・冪等キーを保持する。
- ダッシュボードAPIは本日の集計と不要となった旧情報を返す。既存契約を壊さず別の分析APIを追加し、実績集計はSQL、顧客履歴はまとめて取得する。
- 営業日/休業日・売上データは存在しないため生成しない。予約件数はキャンセルを除く開始日の件数。実来店は完了済み・未キャンセル・開始が現在以前。未登録顧客の予約は来店件数に含め、顧客率の分母には含めない。

## 指標（店舗日付Asia/Tokyo）

- 今月予約: 当月開始日の有効予約（未来の予定を含む）。年間来店: 当年開始日から今日までの実来店件数。
- 新規来店顧客: 全履歴の初回来店日が今月の顧客数。再来店顧客比率: 今月来店した識別可能な顧客のうち、月内最終来店より前に別日の実来店がある顧客の比率。分母0はnull。
- ユーザー承認の暫定基準: 常連は直近12か月に4回以上の実来店、ご無沙汰はそのうち最終来店90日超。間隔変化は4回以上の来店履歴があり、過去の異なる来店日の間隔中央値の1.5倍を超えて未再来店。RF判定とは別の指標で、画面に基準を明記する。
- RF分布は現在適用中の計算履歴に固定。未計算・対象外は通常ランクと分け、実績のない値を埋めない。RF基準日は分析の意味として必要な場所に限定して示し、運用Jobの状態はダッシュボードへ戻さない。
- 個別の未完了予約リスト・ランク低下リストは追加しない。30秒/フォーカス更新を復活させない。

## 検証と実装単位

共通外観、月別カレンダー/空き枠モーダル、分析API/画面を分けて日本語コミットする。関連の型・lint・Vitest/RSpec、実Rails契約、予約競合と認証の回帰、実ブラウザ/タブレット・キーボードの導線を確認する。

不足していたのはプロジェクト固有の配色・視覚階層の判断根拠。既存の全体ルールへ個別進捗を埋め込まず、本設計にtoken/情報設計を記録する。

## 参照

- [デジタル庁 カラー](https://design.digital.go.jp/dads/foundations/color/)
- [カラーのアクセシビリティ](https://design.digital.go.jp/dads/foundations/color/accessibility/) — 本文4.5:1、必要なUI/フォーカス3:1、色以外の手掛かり。
- [Next.js Intercepting Routes](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [Next.js Parallel Routes](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- 実装前にインストール済みNext.jsの同名ドキュメントも確認。soft navigation/直接ロードとmodalのcatch-all fallbackを区別する。
