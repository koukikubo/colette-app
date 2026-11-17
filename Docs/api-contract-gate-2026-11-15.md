# RailsとフロントのAPI契約ゲート

対象 #187。型に合わせた手書きfixtureだけで一致と判断せず、RSpecで実Controllerを通ったJSONをフロントの既存レスポンス型へ照合する。

## 経路と検査

1. `API_CONTRACT_EXPORT=tmp/api-contracts.json` を指定したrequest specからHTTPメソッド・パス・ステータス・実レスポンスを収集する。
2. キー・型・null・enumの構造が同じサンプルをまとめる。入力パラメータ、Cookie、CSRFトークンは保存しない。通常のRSpecでは収集しない。
3. `scripts/generate-api-contracts.mjs` が、実レスポンスと利用側API関数の `Awaited<ReturnType<...>>` を使うTypeScriptを生成する。画面が直接使うデータ型も同じ検査へ含める。
4. 既存の `npm run typecheck` で必須キー、値の型、null、enum、配列とネストを検査する。期待型へのcastや `any` で不一致を隠さない。追加フィールドは互換として許容する。
5. CIのRails jobで生成した同一runのartifactをfrontend jobへ渡す。8領域と400/401/403/409/422が不足した場合や、対応のない成功レスポンスは生成段階で失敗する。

JSONを返さない204は既存のRails/clientテストで確認する。旧`rf_calculation_runs/rollback`には現在のフロント呼出元がないため、型fixtureでは除外理由を明示し、Rails側のspecで検証する。未知のAPIを黙って除外しない。

生成先は `frontend/generated/api-contracts.ts`。テスト用データなのでGitへ含めず、整形・lintからも除外する。型検査には含める。実行はtest環境かつ専用test/e2e DBに限定し、保存先もbackend/tmp配下に限定する。

## 主な命名と境界

| 領域                     | HTTPの契約                                                                                             | 注意点と利用側                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 共通                     | 成功はstatus=success/data、失敗はstatus=error/message/errorsと任意code                                 | errorsは配列または項目別配列。api-client.tsの型を正本にする。Next proxyはsnake_caseと複数Cookieを保持する。                                          |
| 認証・パスワード         | staff_id/passwordでログイン。staff/staff_masterの役割・在籍・ログイン可否を返す                        | staff.idとstaff_master.idは別。本人変更は現在パスワードを要求し、管理者再設定はstaff_masterのlock_versionを送る。入力パスワードはfixtureへ出さない。 |
| 担当者                   | staff_master本体とstaffのログイン情報。更新・退職・復帰・停止・解除・パスワード再設定                  | ownerのみ更新。古いlock_versionは409。staff-master-api.tsとpassword-api.tsの返却型を照合する。                                                       |
| 基本コード               | standard_masters/standard_master、items/standard_list_master、DB id/display_code/system_key            | 利用者が追加した分類のsystem_keyはnull。固定業務キーや表示コードをDB idと同一視しない。                                                              |
| 顧客                     | customer、一覧customers/pagination、customer_kind、customer_rank_id、lock_version                      | 手動customer_rankと詳細のcurrent_rf_rank/rf_rank_basisは別。日時・連絡先・法人項目・RF基準値のnullを維持する。                                       |
| 予約                     | reservation、一覧reservations、customer_id、requested_restaurant_master_type_id、restaurant_master_ids | 顧客なし・席未割当を許す。希望席種と割当席を区別。日時は店舗タイムゾーンの取り扱いと合わせる。作成にIdempotency-Key、更新と状態操作にlock_version。  |
| 席マスタ・空き           | restaurant_masters/restaurant_master、capacity、active、空き照会のunavailable_restaurant_master_ids    | 使用中の定員変更と重複予約はRailsで検証。席種の基本コードと実席のidを区別する。                                                                      |
| RF設定・ルール・実行     | rf_settings、rule_set、calculation_run(s)、results、公開/適用/復元の各返却型                           | base_date、集計期間、rule_set/run idと状態enumを区別。日次実行でも互換上monthly_apply_stateの既存キーを保持する。                                    |
| RF分析・比較・内訳・予測 | rf_analysis、compare/periods、rf_customers、rf_rank_drops、rf_rank_drop_predictions                    | 人数・ランク・顧客ID・状態・ページ情報を検査。基準日、比較年月、初めて低下する日と予測期限を区別。未計算状態のnullableページ情報も照合する。         |
| ダッシュボード           | date/summaryを画面で使用                                                                               | 内部APIに追加フィールドがあっても表示を再追加しない。UIは集計カードと予約管理への導線を維持する。                                                    |

メソッド・パスと利用側関数の対応は `scripts/generate-api-contracts.mjs` が機械的に使う正本。送信キーや状態遷移の検証は既存request spec・並行テスト・E2Eと組み合わせる。型検査だけで業務仕様全体の正しさを保証しない。

## 検出して修正した不一致

基本コード登録の実レスポンスで `system_key: null` が返るのに、フロントの `StandardCode.system_key` はstringだった。DB列とモデルはnullを許し、利用者作成の分類には固定業務キーを付けない仕様なので、フロントを `string | null` へ修正した。比較利用箇所はnullを安全に扱うため表示動作を変更しない。

顧客の追加ランクと、予約や実席が参照する追加の基本コードも業務用codeがnullになることを実request specで確認した。RankSummary・ReservationStandardListMaster・RestaurantMasterTypeのcodeをnullableへ修正した。実席自身の必須codeとは区別する。

管理者のパスワード再設定APIも、実際のStaffMasterResponseを明示して返すよう型を追加した。

## 検証結果

- 実レスポンス収集付きの全RSpec 841例成功。構造別267サンプルを収集し、旧API1件を明示除外して8領域266件を型へ照合。
- 修正前の型でsystem_keyのnullをコンパイルエラーとして検出し、修正後に型検査成功。
- 隔離したバックエンドのコピーだけでCustomerSerializerのnameをcustomer_nameへ変更し、GETの実request specを実行。RSpec自体はID・表示条件の1例に成功したが、その実JSONを型へ渡すと「必須nameがない」でフロント型検査が失敗した。通常の開発コード・DBは改変せず、検証用コピーを使用した。
- 元の実レスポンスへ戻して生成し直し、成功時と同じSHA-256で復元されたことを確認。意図的な破壊を検知できたことと、本来のコードの失敗を混同しない。
- 非test DB名を指定した収集は、example実行前にガードで拒否することを確認した（接続先は到達不能のテスト用URL）。
- 関連フロント41ファイル・221例、フロントlint、変更Ruby3ファイルのRuboCopも成功。
- 追加席種からの実席作成が422になる問題は別途 #201 に記録。読み取り型を直したことだけで登録動線も修正済みとはしない。

## 入口

- `bash scripts/check.sh contracts`: Ruby確認→RuboCop→実レスポンス収集付きRSpec→型fixture生成→フロントtypecheck。
- `bash scripts/check.sh full`: 上記の順でRails側を先に検証し、フロントのlint/Vitest/buildまで実行する。
- `frontend`単独はフロントだけの確認。新鮮なRails契約の検証済みとは扱わない。

DB準備、seed、既存DB削除はこれらのスクリプトで自動実行しない。ホストにRubyがない場合は既存コンテナでRSpecを実行し、ホストのnodeで生成してフロントコンテナでtypecheckできる。
