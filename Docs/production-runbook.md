# 本番導入・復旧の手順

## リリース判定

配置先・公開ドメイン・DB・バックアップ先は未定。コードのテスト成功と、本番運用開始の承認を区別する。以下の実証記録が揃うまでは実顧客情報を投入しない。

## 構成

compose.production.ymlを単独利用する。フロントのみlocalhostへ公開し、TLS終端を通す。Rails・DB・workerをインターネットへ直接公開しない。開発用docker-compose.ymlと重ねない。
入口を店舗のVPN/認証付きアクセスプロキシ等で制限する。未認証の担当者選択APIが存在するため、インターネットへ直接公開する場合は選択式ログインの仕様自体を変更してから公開する。
TLS終端がクライアント由来の転送ヘッダーを除去し、信頼できる接続元情報を設定することを確認する。ログイン制限はRailsが認識するIPで20回/分、アカウントで5回/分。Next proxy経由ではIPが共有される場合があるため、入口側でも送信元ごとの試行制限を実施する。

## 環境変数とDB

SECRET_KEY_BASE、DATABASE_URLを秘密管理基盤で設定する。RAILS_ASSUME_SSL=trueはTLS終端の背後だけで使用する。
RAILS_ALLOWED_HOSTSに許可する内部ホスト/公開ホストをカンマ区切りで設定する。Host制限も配置先で検証する。
CACHE_DATABASE_URL/QUEUE_DATABASE_URL/CABLE_DATABASE_URLも設定し、四つの論理DBを用意する。同じURLを使い回さない。DBスキーマの初期化を確実に分離する。DBユーザーには必要なスキーマ権限だけを付与する。
リリース前に別環境へバックアップを復旧し、同じイメージでdb:prepareを検証する。既存の短いパスワードは自動変更されないため、導入時に12文字以上へ更新する。初回展開後は旧Cookieが無効となり、全スタッフが再ログインする。
本番seedは基本マスタとRFルールだけを作り、デモ顧客・予約・共通パスワードのスタッフは投入しない。初回ownerはBOOTSTRAP_OWNER_CODE/BOOTSTRAP_OWNER_NAME/BOOTSTRAP_OWNER_PASSWORDを秘密管理から渡し、security:bootstrap_ownerを一度実行して作成する。

## 必須の実環境チェック

- 完成したfrontend/backendイメージをビルドし、そのイメージをTrivyで検査する。未修正の指摘は影響・受容判断を記録する。
- HTTPSでSecure/HttpOnly/SameSite Cookieを確認する。
- 正規CSRFでログイン/顧客登録/予約作成を成功させ、不正CSRFは拒否する。
- owner/operator/viewerで操作権限を確認する。viewerは閲覧のみ、operatorは顧客・予約更新とマスタ閲覧、ownerは全操作。
- ログアウト後の旧Cookie再送、無操作4時間・絶対12時間の失効を確認する。
- Next経由で顧客→予約→RF計算→適用→顧客表示まで確認する。
- backend /upを内部監視する。DB疎通・worker処理の遅延・長時間processingを別監視し、外部通知先へテスト通知する。/upだけをDB/workerの正常判定に使わない。

workerのDB接続はセッション固定の直接接続を使用する。RFの実行中ロックはsession advisory lockを使うため、トランザクションプーリングの接続先はworkerに使用しない。

## セッション・アカウント復旧

最後の有効ownerの降格・退職・ログイン停止を拒否する。全ownerがロックされた場合、DB実行権限を持つ運用者だけが以下を実行する。

```sh
OWNER_CODE=対象コード RAILS_ENV=production bundle exec rake security:recover_owner
```

復旧時は既存セッションを失効する。操作者・理由・時刻をアクセス制限された監査記録に残す。外部から呼べる復旧APIを作らない。
security:cleanupで期限切れセッション・古い試行履歴を毎日削除する。配置先のスケジューラーで実行し、失敗を通知する。

## RF処理の復旧

```sh
RUN_ID=対象ID RAILS_ENV=production bundle exec rake rf:recover
```

手動計算はprocessing状態のみ、月次計算はpending/processing/failed状態を再配信する。月次計算は保存した対象月・同じ履歴IDで再試行する。実行中workerがDBロックを保持している間は重複計算しない。強制終了した接続のロックはDBが解放する。手動計算のfailedは原因を解消後、新規計算として再作成する。現在適用中の結果は維持する。
新方式の初回導入時は旧workerを全て停止してから新workerを起動する。

## バックアップ・復旧・切戻し

配置先に合わせて、暗号化・別障害ドメインのバックアップと復旧目標を決める。運用開始前の目標案はRPO24時間/RTO4時間。運用責任者が承認する。

1. 書込を停止し、DBと必要なファイルのバックアップを取得する。
2. 本番から分離したDBへ復旧する。送信・定期Jobを停止し実顧客への通知を防ぐ。
3. 顧客・予約・RF履歴の件数と関連、ログイン、主要導線を確認する。
4. 復旧時間、バックアップ時刻、使用イメージ、結果を記録する。
5. 切戻しは旧イメージだけで動くDBスキーマか確認する。破壊的migrationではDB復旧が必要。未確認のrails db:rollbackを本番で実行しない。

## ログ

個人情報・検索語はパラメータフィルターで除外する。アプリ独自ログとproxy/アクセスログは別途ダミー入力で確認する。URLクエリに検索語を記録するアクセスログは無効化またはマスクする。
閲覧は運用責任者に限定し、保持30日を初期案として配置先で設定・承認する。秘密値や実顧客情報を検証成果物へ保存しない。

## RF月次自動更新

本番のSolid Queue scheduler/workerを起動し、`config/recurring.yml`の`monthly_rf_update`を登録する。
実行時刻は日本時間の毎月1日03:00、対象は前月末基準。公開中の有効なRFルールが必要。
開発用composeのRails起動だけでは、この本番定期ジョブは起動しない。

同じ対象月は一意に記録し、計算失敗は30秒間隔で最大3回試行する。計算中の手動適用・復元は設定の版番号で検出し、上書きせず`conflict`にする。
ダッシュボードとRF計算履歴で`failed`/`conflict`を確認し、ジョブ遅延・失敗を監視する。
停止中に実行時刻を逃した場合、対象月を明示して補完する（自動catch-upは行わない）。

```sh
RAILS_ENV=production bundle exec rails runner 'MonthlyRfUpdateJob.perform_later("2026-10-01")'
```

対象月は前月以前の月初日。上記は例なので補完する月へ置き換える。適用済み月の再配信は再適用しない。
`conflict`はRF計算履歴の結果を確認して手動適用する。コード更新時は70000/71000のmigrationを適用後、Railsとworkerを同じ版で再起動する。
