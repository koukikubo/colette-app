#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-full}"
case "$mode" in frontend|backend|full|e2e) ;; *) echo "usage: bash scripts/check.sh [frontend|backend|full|e2e]" >&2; exit 2;; esac
# サービス起動・DB準備は明示して行う。ここでは専用環境のテストだけを実行する。
if [[ "$mode" == e2e ]]; then
  (cd frontend && npm run test:e2e)
  exit
fi
if [[ "$mode" == frontend || "$mode" == full ]]; then
  (cd frontend && npm run typecheck && npm run lint && npm run test:run)
fi
if [[ "$mode" == backend || "$mode" == full ]]; then
  (
    cd backend
    expected_ruby="$(tr -d '\n' < .ruby-version)"
    actual_ruby="$(ruby -e 'print RUBY_VERSION')"
    if [[ "$actual_ruby" != "$expected_ruby" ]]; then
      echo "Ruby $expected_ruby required; found $actual_ruby" >&2
      exit 1
    fi
    export RAILS_ENV=test
    bundle exec rubocop
    bundle exec rspec
  )
fi
if [[ "$mode" == full ]]; then
  (cd frontend && npm run build)
fi
