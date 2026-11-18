# 依存関係・コンテナ検査の修正（2026-11-19）

## npm監査

CIの17件のHIGHは、picomatchの1件の告知が開発依存へ波及したもの。npmレジストリの結果には残っていたが、[GitHub公式告知](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)と公式APIでは2026-11-18T15:38:56Zに撤回済みであることを確認した。未公開の修正版を仮定したoverrideや、依存関係の無関係なメジャー更新は行わない。

`scripts/check-npm-audit.mjs`は従来どおりnpm監査を実行し、moderate以上の根拠告知を依存グラフから解決する。公式APIの同じGHSA IDに有効な撤回日時がある場合だけ区別し、有効な告知は失敗対象に残す。HTTPエラー・タイムアウト・不正な結果・依存経路の欠落も失敗させる。npmの元のJSONはCI artifactへ保存する。個別IDの許可リストは設けない。

ローカルでは`cd frontend && node ../scripts/check-npm-audit.mjs`、判定の回帰検証はリポジトリ直下で`node --test scripts/check-npm-audit.test.mjs`。出力を保存する場合は`NPM_AUDIT_REPORT`に保存先を指定する。

## イメージ

- PostgreSQLは17.11からセキュリティ修正版17.12へ更新する。メジャー17と既存volumeのパスを維持する。[公式リリースノート](https://www.postgresql.org/docs/17/release-17-12.html)を参照。
- 開発用Ruby/Node/PostgreSQLのビルド時にOS更新を取り込み、Runtime securityはcomposeで実際に起動するイメージを検査する。
- 未更新の素のRubyイメージを、更新済みのアプリイメージの検査と混同しない。本番はProduction imagesで最終イメージを検査し、日次・main pushにも実行する。
- Production imagesは並列ジョブを片方の失敗でキャンセルせず、両方の全件JSONを保存する。HIGH/CRITICALは修正版未提供でも失敗する従来の基準を維持する。Runtime securityの修正可能HIGH/CRITICAL・秘密情報を拒否する基準も維持する。

修正版未提供のOS指摘は残る。検査基準の緩和、CVEの無条件抑制、成功と偽った本番可否判定は行わない。[Debianのzlib修正版](https://security-tracker.debian.org/tracker/CVE-2026-85091)など、ベンダーの提供状況と実際の検査結果を照合する。

## データの保全

専用の空volumeで17.11を起動し、テスト行を保存して停止後、同じvolumeを17.12で起動してバージョンと保存行の一致を確認した。通常の開発DBと稼働コンテナは置き換えていない。

既存環境へ反映する際は、DBバックアップを取得してから計画した再作成で適用する。イメージのビルドだけでは、起動済みコンテナは更新されない。
