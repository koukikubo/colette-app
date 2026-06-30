# frozen_string_literal: true

default_password =
  ENV.fetch("SEED_STAFF_PASSWORD", "password")

staff_definitions = [
  {
    code: "00001",
    name: "店主",
    role_code: "owner",
    memo: "初期店主アカウント"
  },
  {
    code: "00002",
    name: "登録担当",
    role_code: "operator",
    memo: "照会・登録を行う初期担当者"
  },
  {
    code: "00003",
    name: "照会担当",
    role_code: "viewer",
    memo: "照会のみを行う初期担当者"
  }
].freeze

StaffMaster.transaction do
  staff_definitions.each do |attributes|
    staff_master =
      StaffMaster.find_or_initialize_by(
        code: attributes.fetch(:code)
      )

    staff_master.assign_attributes(
      name: attributes.fetch(:name),
      role_code: attributes.fetch(:role_code),
      employment_started_on: Date.current,
      retired_on: nil,
      memo: attributes.fetch(:memo)
    )

    staff_master.save!

    staff =
      Staff.find_or_initialize_by(
        staff_master: staff_master
      )

    staff.assign_attributes(
      password: default_password,
      password_confirmation: default_password,
      login_enabled: true,
      failed_attempts: 0
    )

    staff.save!
  end
end