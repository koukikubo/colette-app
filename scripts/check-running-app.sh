#!/usr/bin/env bash
set -euo pipefail

# /upだけでは未適用migrationやNext→Railsの障害を検出できないため、実APIも確認する。
frontend_url="${COLETTE_FRONTEND_URL:-http://localhost:3010}"
backend_url="${COLETTE_BACKEND_URL:-http://localhost:3011}"
check_status() {
  local url="$1" expected="$2" status
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --max-time 20 "$url")"
  if [[ " $expected " != *" $status "* ]]; then
    echo "NG: $url (HTTP $status / expected: $expected)" >&2
    return 1
  fi
  echo "OK: $url (HTTP $status)"
}
check_status "$backend_url/up" "200"
check_status "$frontend_url/login" "200"
check_status "$frontend_url/api/v1/staff/login_options" "200"
# Cookieを送らない検査なので401が正常。500をログアウトと取り違えない。
check_status "$frontend_url/api/v1/staff/current" "401"
echo "起動時の疎通確認が完了しました。ログイン後の業務操作は別途ブラウザで確認してください。"
