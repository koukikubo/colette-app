FactoryBot.define do
  factory :reservation do
    sequence(:reservation_name) do |number|
      "予約者#{number}"
    end

    sequence(:reservation_phone_number) do |number|
      format("090%08d", number)
    end

    starts_at do
      Time.zone.local(
        Time.zone.today.year,
        Time.zone.today.month,
        Time.zone.today.day,
        18,
        0
      )
    end

    ends_at { starts_at + 2.hours }

    guest_count { 2 }

    association :requested_restaurant_master_type,
                factory: :standard_list_master

    association :reservation_status,
                factory: :standard_list_master

    association :created_by_staff,
                factory: :staff

    updated_by_staff { created_by_staff }

    canceled_at { nil }

    trait :canceled do
      canceled_at { Time.current }
    end

    trait :details_confirmed do
      details_confirmed_at { Time.current }
    end
  end
end