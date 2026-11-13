<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Colette development

すべての開発・設計・レビューは Docs/development-harness.md の全体ルールに従う。作業開始時に読む。
アプリの目的と現在の業務仕様は Docs/application-specification.md、環境・検証コマンドは Docs/development-environment.md を参照し、対象機能の実装とテストも確認する。
API契約変更には .agents/skills/colette-api-contract/SKILL.md、不具合調査・修正には .agents/skills/colette-repair/SKILL.md を使う。スキルは全体ルールを補足する。
既存の未コミット変更を確認して保持し、仕様・受入条件・影響範囲を明確にしてから実装する。個別Issueの進捗を全体ルールへ埋め込まない。

## 利用方針とスキル

通常はユーザーが実装する。AIは既存コードを確認し、設計・実装手順・コード例・根拠・検証方法を説明する。コード編集、DB変更、Issue作成、コミットや外部サービスへの書き込みは明示依頼時に行う。説明・相談だけの依頼を自動実装へ拡張しない。
- 設計・実装相談: .agents/skills/colette-design-advice/SKILL.md
- API・データ整合性確認: .agents/skills/colette-api-contract/SKILL.md
- UI・UX: .agents/skills/colette-ui-ux/SKILL.md
- セキュリティ監査: .agents/skills/colette-security-audit/SKILL.md（内部コード・設定・依存関係の脆弱性と改善箇所を監査）
不具合調査スキルは補助として保持する。独立したコードレビュースキルは追加せず、レビューはGitHub側のCodexを使う。

自動修正を依頼された場合は、専用ブランチで検証まで進め、機能・修正目的ごとに日本語でコミットする。UI・UX・CXとデータ整合性の品質基準は全体ハーネスに従う。
