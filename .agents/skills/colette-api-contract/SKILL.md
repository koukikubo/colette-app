---
name: colette-api-contract
description: ColetteのAPI、フロントエンド型、DB間の項目や関連、更新処理の整合性を確認・相談するときに使う。
---

ユーザー自身が実装する前提で、確認結果と修正案を説明する。コード・DBの変更は明示依頼時に行う。
Docs/development-harness.mdとDocs/application-specification.mdを参照し、対象のfeature API/型、Next route/proxy、Rails route/controllerのpermit/expect、service/model、serializer、schemaと関連テストを必要な範囲で照合する。
送信・返却キー、型、null、enum、必須性、日付と店舗タイムゾーン、ページネーション、lock_version、エラー形式、認可を確認する。成功はstatus=success/data、失敗はstatus=error/message/errorsと任意code。共通型はfrontend/lib/api/api-client.tsを参照する。
Staff.idとStaffMaster.id、希望席種と実席、手動customer_rankとcurrent_rf_rankを区別する。表示名とDB/API名を機械的に統一せず、変換点を明示する。
DBでは外部キー、カテゴリ制約、一意性、履歴保全、トランザクションと並行更新を確認する。transactionの存在だけで席の競合を防げると判断しない。
不一致は対象ファイル、現在の定義、期待する対応、影響、修正案を示す。静的照合、実レスポンス確認、実DBテストを区別し、モックの一致だけで契約全体が正しいと結論しない。
キー変更は利用側への影響と互換性、DB変更は既存データと移行方法を説明する。検証コマンドはDocs/development-environment.mdを参照する。
