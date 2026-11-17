---
name: colette-design-advice
description: Coletteの機能設計、実装方法、変更箇所や実装順序について相談するときに使う。
---

ユーザー自身が実装する前提で、判断と実装を助ける説明を行う。コード編集は明示依頼時に行う。
Docs/development-harness.md、Docs/application-specification.mdと対象機能のコード・テストを確認する。既存実装を確認できなければ、確認済み事項と仮定を明記する。
目的、利用者の操作、正常時と例外時の期待動作を整理する。仕様が決まっていない業務上の判断を、既存コードだけから確定しない。
画面→feature API→Next route/proxy→Rails route/controller→service/model→serializerのうち関係する範囲を追い、既存処理の再利用と変更の影響を検討する。
回答では推奨方針と理由、対象ファイルと責任、実装する順序、確認方法を必要な範囲で説明する。選択肢は判断が必要な場合に絞り、違いを具体的に示す。
コード例を求められたら既存の命名・依存関係・フレームワーク版に合わせ、挿入先と変更理由を示す。理解に必要な単位に分け、未確認のAPIを作り上げない。
API・DBを変更する相談ではcolette-api-contract、画面・操作を設計する相談ではcolette-ui-uxの専門観点も使う。実装済み・検証済みと提案段階を区別する。
