# frozen_string_literal: true

owner_master = StaffMaster.find_or_create_by!(code: "STF001") do |master|
  master.name = "オーナー"
  master.role_code = "owner"
  master.employment_started_on = Date.current
  master.memo = "初期オーナーアカウント"
end

owner_staff = Staff.find_or_initialize_by(staff_master: owner_master)

owner_staff.password = "password"
owner_staff.password_confirmation = "password"
owner_staff.login_enabled = true
owner_staff.failed_attempts = 0

owner_staff.save!