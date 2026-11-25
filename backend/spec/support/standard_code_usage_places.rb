RSpec.configure do |config|
  # テストDBはschemaから作られるため、migrationの参照データだけを投入する。
  config.before(:suite) { load Rails.root.join("db/seeds/standard_code_usage_places.rb") }
end
