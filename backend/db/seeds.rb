# frozen_string_literal: true

# 本番へデモ顧客・予約や共通パスワードのスタッフを投入しない。
if Rails.env.production?
  load Rails.root.join("db/seeds/standard_masters.rb")
  load Rails.root.join("db/seeds/rf_rules.rb")
else
  load Rails.root.join("db/seeds/staffs.rb")
  load Rails.root.join("db/seeds/standard_masters.rb")
  load Rails.root.join("db/seeds/rf_rules.rb")
  load Rails.root.join("db/seeds/restaurant_masters.rb")
  load Rails.root.join("db/seeds/reservations.rb")
  load Rails.root.join("db/seeds/customers.rb")
  load Rails.root.join("db/seeds/rf_calculation_reservations.rb")
end
