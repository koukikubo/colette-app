# 実DBを使うE2Eは、明示指定した専用test DBだけで動かす。
require "uri"
uri = URI.parse(ENV.fetch("DATABASE_URL"))
unless Rails.env.test? && ENV["COLETTE_E2E"] == "1" && uri.path.match?(/_e2e(?:_|$)/)
  abort "E2E requires RAILS_ENV=test, COLETTE_E2E=1 and a dedicated *_e2e database"
end
actual_database = ActiveRecord::Base.connection_db_config.database
abort "E2E database URL does not match active connection" unless uri.path == "/#{actual_database}"
