FactoryBot.define do
  factory :restaurant_master do
    association :restaurant_master_type,
                factory: :standard_list_master

    association :created_by_staff,
                factory: :staff

    updated_by_staff { created_by_staff }

    sequence(:sequence_number) do |number|
      number
    end

    sequence(:code) do |number|
      "RT#{number.to_s.rjust(2, "0")}"
    end

    sequence(:name) do |number|
      "テスト席#{number}"
    end

    capacity { 4 }
    active { true }

    sequence(:position) do |number|
      number
    end

    memo { nil }
  end
end