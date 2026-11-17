# ログインからRF適用までの実サービスE2E

対象 #188。Playwright ChromiumからUIを操作し、Nextのproxy、Rails、専用PostgreSQL、非同期Job、結果表示を接続する。APIやJobのレスポンスはモックしない。

## 確認する操作

1. 未認証で顧客APIが401、管理者の画面ログインが成功する。
2. CSRFトークンなしの更新が422で拒否される。
3. 顧客登録フォームから保存し、一覧へ反映される。
4. 登録した顧客を検索・選択して昨日の予約を作成し、対応完了にする。
5. RF管理画面から計算を受け付け、非同期Jobの完了を待ち、画面から適用する。
6. 顧客詳細の予約履歴と、適用済みRFのEランク・来店1回を実APIでも確認する。

## 環境とガード

- `RAILS_ENV=test`、`COLETTE_E2E=1`、名前に `_e2e` を持つ専用DBを必須とし、DATABASE_URLと実際の接続先DB名の一致も確認する。
- 通常の開発ポート3010/3011や本番DBはテスト対象にしない。Playwrightも明示フラグとlocalhostのURL、専用パスワードを要求する。
- DBの準備は明示して `guard.rb` → `db:schema:load` → `prepare.rb` の順に行う。`prepare.rb` は空DBだけを受け付け、初期マスタ・公開RFルール・検証用ownerだけを作成する。既存データを削除しない。
- `db:prepare` は新しいDBで大量のデモseedも起動するため、E2E準備には使わない。
- RailsサーバーはCSRF保護を有効化し、Jobはtest adapterではなくAsync adapterで実行する。Solid Queueのscheduler/workerの常駐検証とは別の対象である。
- Nextは本番ビルドのstandaloneサーバーを使用する。静的ファイルも本番Dockerfileと同じ配置にコピーする。
- CIのDBはGitHub Actions専用service。初期管理者のパスワードを本番へ流用しない。

## 共通入口

専用DBとサービスを起動してから、`COLETTE_E2E=1 E2E_PASSWORD=... E2E_BASE_URL=http://127.0.0.1:4100 bash scripts/check.sh e2e` を実行する。スクリプトはDB準備やseed、既存DB削除を自動実行しない。CIの全準備手順は `.github/workflows/e2e.yml` を正本とする。

## 2026-11-14の検証

- 隔離したRails(test)・専用PostgreSQL・Next standalone・Chromiumで実行し、1シナリオ成功（45.6秒、操作本体42.1秒）。
- 初回のテスト停止は、必須印を含むラベルへの完全一致指定だった。アクセシブルなtextbox名で指定し直して成功。アプリの障害とは区別する。
- 最初のDB準備で `db:prepare` のデモseed起動を確認したため、その専用DBだけを作り直し、schemaの読み込みと最小fixtureへ変更した。通常の開発DBには変更していない。
- フロントtypecheck、本番ビルド、変更Ruby3ファイルのRuboCop成功。
- 実行フラグなしの起動はガードで拒否することを実環境で確認。検証後、一時コンテナ2個と専用DBを削除済み。
- GitHub上でのCI実行結果はPRで追跡する。配置先は未定であり、本番TLS、常駐Job、外部バックアップ復旧の完了証明とはしない。
