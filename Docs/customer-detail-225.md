# 顧客詳細・店舗独自項目

承認済みUI案に沿い、上部の基本情報とランク、4タブ、基本コードを再利用する顧客独自項目を実装する。抽出・CSVは対象外。

## データと更新

- `standard_masters.customer_detail_mode`: none（未使用）/single/multiple。既存データはnoneのまま。
- `customer_detail_group`: 任意の分類、50文字以内。
- `customer_detail_selections`: 顧客と選択肢の関連。親は選択肢から導出し、親IDを二重保存しない。外部キー・顧客/選択肢の一意制約を持つ。
- GET/PATCH `/api/v1/customers/:id/detail_fields`。PATCHは `customer_details: {lock_version, answers: [{field_id, option_ids: []}]}`。変更した項目だけを送る。空配列はその項目の回答解除。未送信項目は保持する。
- 回答は顧客の版と更新担当者/日時を更新し、通常の顧客編集とも競合を検知する。共通設定ロックでマスタ停止・単複変更と直列化する。
- 無効項目は既存回答があるとき読み取り専用で返す。無効選択肢は既存選択の保持だけ許可する。無効化による暗黙削除・選択肢の親取り違えを防ぐ。

## ローカル環境

開発DBは `backend_development` を確認し、2026-11-25の追加マイグレーション適用前にバックアップを取得。バックアップはリポジトリ外の `/private/tmp/colette-225-development-before.dump`（0600）、pg_restore --listで読み取り確認済み。seed・既存データ削除・本番デプロイは行っていない。

専用test DBでAPI・権限・不正な回答・競合・無効回答保持・1000項目を検証。フロントでは入力保持・保存後再取得失敗・409・viewer・タブURLを検証。最新結果はPRへ記録する。

## 根拠

- Railsの外部キー・チェック制約: https://guides.rubyonrails.org/active_record_migrations.html
- Railsのlock_version: https://guides.rubyonrails.org/active_record_querying.html#optimistic-locking
- NextのRoute Handler: ローカル `frontend/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`。

過去のRF計算結果・予約状態遷移・認証Cookie+CSRF・Browser→Next→Railsの経路は変更しない。
