FactoryBot.define do
  factory :staff do
    association :staff_master

    password { "Password123!" }
    password_confirmation { "Password123!" }

    login_enabled { true }
    failed_attempts { 0 }
    locked_at { nil }
    last_logged_in_at { nil }
  end
end