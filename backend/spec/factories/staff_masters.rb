FactoryBot.define do
  factory :staff_master do
    sequence(:code) do |number|
      "STF#{number.to_s.rjust(3, "0")}"
    end

    sequence(:name) do |number|
      "担当者#{number}"
    end

    role_code { "operator" }
    employment_started_on { Date.new(2026, 1, 1) }
    retired_on { nil }
    memo { nil }
  end
end