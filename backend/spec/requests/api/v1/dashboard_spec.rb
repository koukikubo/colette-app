require "rails_helper"

RSpec.describe "本日のダッシュボード", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  before { travel_to Time.zone.local(2026, 11, 13, 12) }
  after { travel_back }

  it "未ログインでは取得できない" do
    get "/api/v1/dashboard"
    expect(response).to have_http_status(:unauthorized)
  end

  it "店舗日付の予約を集計しキャンセル・完了・他日を区別する" do
    login!
    type = create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type"))
    status = create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status"))
    attributes = { requested_restaurant_master_type: type, reservation_status: status, created_by_staff: login_staff, updated_by_staff: login_staff }
    start = Time.zone.today.beginning_of_day + 18.hours
    pending = create(:reservation, **attributes, starts_at: start, ends_at: start + 2.hours, guest_count: 3)
    create(:reservation, **attributes, starts_at: start, ends_at: start + 2.hours, guest_count: 2, completed_at: Time.current)
    create(:reservation, **attributes, starts_at: start, ends_at: start + 2.hours, guest_count: 4, canceled_at: Time.current)
    create(:reservation, **attributes, starts_at: start + 1.day, ends_at: start + 1.day + 2.hours, guest_count: 10)
    get "/api/v1/dashboard"
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("data")
    expect(data["date"]).to eq("2026-11-13")
    expect(data["summary"]).to eq("reservation_count" => 2, "expected_guest_count" => 3, "completed_count" => 1, "canceled_count" => 1, "unassigned_count" => 1, "unconfirmed_count" => 1)
    expect(data["reservations"].map { |row| row["id"] }).to eq([ pending.id ])
    expect(data.dig("rf", "base_date")).to be_nil
  end
end
