require_relative "guard"
# 空の専用DBだけに初期マスタを作成する。削除や業務データのseedは行わない。
abort "E2E database must be empty" if StaffMaster.exists? || Customer.exists? || Reservation.exists? || RfRuleSet.exists?
load Rails.root.join("db/seeds/standard_masters.rb")
load Rails.root.join("db/seeds/rf_rules.rb")
password = ENV.fetch("E2E_PASSWORD")
master = StaffMaster.create!(code: "E2E_OWNER", name: "E2E管理者", role_code: "owner", employment_started_on: Date.current - 1.year)
master.create_staff!(password: password, password_confirmation: password, login_enabled: true)
puts "E2E fixtures prepared"
