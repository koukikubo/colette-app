# 開発環境と検証コマンド

環境の具体値は .github/workflows/ci.yml、docker-compose.yml、各package.json/lockfile、backend/.ruby-versionを参照する。変更時には相互の一致を確認する。

## 検証入口

- `bash scripts/check.sh frontend`: typecheck / lint / Vitest
- `bash scripts/check.sh backend`: Rubyバージョン確認 / RuboCop / RSpec
- `bash scripts/check.sh full`: 両方とNext build
- `npm run format:check`: リポジトリ全体の整形確認

Node・npmはCI設定、Rubyはbackend/.ruby-versionの指定に合わせる。frontendとrootでそれぞれnpm ci。バックエンドはbundle install後、専用test DBを設定する。
DB準備は明示して実行する。スクリプトはdb:prepare、seed、既存DBの削除を自動実行しない。DATABASE_URLがある場合は専用test DBであることを実行者が確認する。

## 既存Docker環境での検証

ホストのRubyやnode_modulesが揃わない場合は、起動済みの開発コンテナを使える。

```sh
docker exec -e RAILS_ENV=test colette_backend bundle exec rspec
docker exec colette_frontend sh -lc 'npm run typecheck && npm run lint && npm run test:run'
```

コンテナ名と実行先はdocker-compose.ymlで確認する。ホストとコンテナはnode_modulesを共有していないため、ホストの依存不足をそのままアプリの欠陥と判断しない。
