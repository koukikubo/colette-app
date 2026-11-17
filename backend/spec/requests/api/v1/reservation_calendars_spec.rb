require "rails_helper"
RSpec.describe "月別予約カレンダー", type: :request do
  include_context "authenticated request"
  let(:seat_type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }
  let(:attributes) { { requested_restaurant_master_type: seat_type, reservation_status: status, created_by_staff: login_staff, updated_by_staff: login_staff } }
  it "未認証は401で拒否する" do
    get "/api/v1/reservation_calendar", params: { month: "2026-11" }
    expect(response).to have_http_status(:unauthorized)
  end
  it "店舗の月境界・キャンセル・席未割当を区別し日ごとに集計する" do
    login!
    create(:reservation, **attributes, starts_at: Time.zone.local(2026, 10, 31, 21), ends_at: Time.zone.local(2026, 11, 1), guest_count: 9)
    create(:reservation, **attributes, starts_at: Time.zone.local(2026, 11, 1, 17), ends_at: Time.zone.local(2026, 11, 1, 19), guest_count: 3)
    create(:reservation, **attributes, starts_at: Time.zone.local(2026, 11, 1, 20), ends_at: Time.zone.local(2026, 11, 1, 22), guest_count: 5, canceled_at: Time.current)
    get "/api/v1/reservation_calendar", params: { month: "2026-11" }
    expect(response).to have_http_status(:ok)
    days = response.parsed_body.dig("data", "days")
    expect(days.size).to eq(30)
    expect(days.first).to eq("date" => "2026-11-01", "reservation_count" => 1, "guest_count" => 3)
    expect(days.last).to include("reservation_count" => 0)
  end
  it "実在しない年月と配列を400で拒否する" do
    login!
    [ "2026-13", "2026-2", [ "2026-11" ] ].each do |month|
      get "/api/v1/reservation_calendar", params: { month: month }
      expect(response).to have_http_status(:bad_request)
    end
  end
end
