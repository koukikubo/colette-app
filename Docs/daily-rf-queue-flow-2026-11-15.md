# 日次RFの実プロセス検証（2026-11-15）

Issue #163。基点 `dc56b6be457b12d567f07198eb5eb60a7b80c550`。

## 確認対象

RSpecのJobモックやAsync adapterの成功だけでは、Solid Queue schedulerが配送し、永続queueからfork workerが実行することを証明できないため、専用E2E DBで実プロセスを接続する。

`test/e2e/daily_queue_flow.rb` は既存のE2E guardを通し、test環境・明示フラグ・URLと実接続の一致・専用*_e2e DB名を要求する。公開RFルールと初期担当者があるDBを対象とし、既存の日次履歴やqueueテーブルがある場合は停止する。既存のqueueを削除する処理は追加しない。

## 実行内容

1. 本番recurring.ymlのJobクラスと、冬・夏とも日本時間03:00になるcronをFugitで検証する。
2. 検証用の未訪問顧客とqueueテーブルを専用DBへ作成する。
3. 本番と同じJobを検証専用の5秒間隔でschedulerへ登録し、Solid Queue adapterとfork workerを別プロセスで起動する。本番cronは変更しない。
4. schedulerによる2回以上の配送とJob完了、当日基準のcompleted/applied履歴が1件、現在適用先、顧客ごとの結果保存、設定版が開始時から正確に1増加することを確認する。
5. supervisorを停止し、子worker/dispatcher/schedulerの終了を待つ。期限超過・Job失敗は検証失敗とする。

他プロセスのコミットを毎回確認するためquery cacheを無効にする。初回の観測用実行ではキャッシュによって完了を観測できずタイムアウトしたため、キャッシュを外して再実行した。アプリの計算処理自体はcompleted/appliedになっていた。

## 検証入口

既存のCore flow E2Eワークフローで、ブラウザからの予約・RF適用の後に以下を実行する。

```sh
cd backend
bundle exec rails runner test/e2e/daily_queue_flow.rb
```

先に専用の空DBへschemaをロードし、`test/e2e/prepare.rb` で初期マスタを準備する。開発・本番DBには実行しない。自動的なDBの作成・削除・seedはこの検証スクリプトでは行わない。失敗時は `backend/tmp/e2e-daily-queue.log` をCI artifactへ残す。

ローカルではこの検証用に作成した `colette_daily_queue_e2e_20261115` だけを使用。通常test DB名はguardで拒否することを確認。変更RubyのRuboCopも成功。

これはtest構成での実プロセス検証であり、本番の分離DB接続、コンテナ再起動、監視、実際の03:00の稼働確認は #161・#189 に残る。配置先は未定。
