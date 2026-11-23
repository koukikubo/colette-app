# Ruby 3.4.13へのセキュリティ更新（2026-11-23）

## 背景と修正

PR #240でBrakemanを8.1.1へ更新したところ、Ruby 3.4.12にCVE-2026-132825があることを検出してCIが停止した。Go/gosuの修正とは別の問題。

[Ruby公式のセキュリティ情報](https://www.ruby-lang.org/en/news/2026/11/18/multiple-vulnerabilities-in-regexp-and-string/)は、正規表現と文字列の大小文字変換にある7件の問題を案内している。Ruby 3.4.0〜3.4.12が対象で、同じ3.4系の修正版は3.4.13。Colette上での攻撃成立を再現したものではないが、対象ランタイムを更新する。

前回のRuby更新は11月7日の3.4.4→3.4.12。これは[10月公開の問題](https://www.ruby-lang.org/en/news/2026/10/23/regexp-fixes-for-gitlab-cves/)への対応であり、今回の問題を修正するバージョンではない。11月19日の検査記録があっても、その時点の検出結果だけで安全性全体を保証しない。

## 変更対象

- `backend/.ruby-version`：CI・ローカル用の指定を3.4.13へ更新。
- `backend/Dockerfile`：本番向けイメージのRubyを3.4.13へ更新。
- `backend/Dockerfile.dev`：開発イメージのRubyを3.4.13へ更新。
- `docker-compose.yml`：開発イメージタグを実際のRuby版と一致させる。
- `.github/workflows/security.yml`：更新後の開発イメージをビルドして検査する条件を一致させる。

検査を無効化したり、警告の抑制・深刻度の除外・品質基準の緩和は行わない。通常利用中のコンテナやDBは置き換えず、本番デプロイも実施しない。実行中のRubyが更新されるには、別途コンテナの再ビルド・再作成が必要。

## 検証と残件

Rubyの版指定とCompose設定を確認し、最終コミットのCIでBrakeman・bundler-audit・RSpec・フロント検証・API契約・実サービスE2E・ランタイムイメージ検査を確認する。実行結果はPR #240へ記録する。

本番イメージの検査も確認するが、修正版が提供されていないHIGH/CRITICALまで今回の更新だけで解消したとは扱わない。保存済みの過去の検証結果は、その時点の結果として保持する。
