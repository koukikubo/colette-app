FactoryBot.define do
  factory :reservation do
    customer { nil }
    starts_at { "2026-07-01 10:18:24" }
    ends_at { "2026-07-01 10:18:24" }
    guest_count { 1 }
    reservation_status_code { "MyString" }
    reservation_route_code { "MyString" }
    memo { "MyText" }
    canceled_at { "2026-07-01 10:18:24" }
    lock_version { 1 }
  end
end
