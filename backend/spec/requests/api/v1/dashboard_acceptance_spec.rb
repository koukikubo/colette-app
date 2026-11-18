require "rails_helper"

RSpec.describe "ダッシュボードの数値・日付境界の受入", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  let(:seat_type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }
  before { travel_to Time.zone.local(2026, 11, 15, 23) }
  after { travel_back }

  # モデルの営業時間・競合検証を通る来店記録を作り、予定日時と完了記録を区別する。
  def booking(day, customer: nil, completed: true, canceled: false, hour: 18, guests: 2)
    start = day.to_date.in_time_zone + hour.hours
    create(:reservation, customer: customer, requested_restaurant_master_type: seat_type, reservation_status: status,
      created_by_staff: login_staff, updated_by_staff: login_staff, starts_at: start, ends_at: start + 2.hours,
      guest_count: guests, completed_at: completed ? Time.current : nil, canceled_at: canceled ? Time.current : nil)
  end

  it "UTCでは前年の日付でも店舗の年・月・本日を基準にする" do
    travel_to Time.zone.local(2027, 1, 1, 0, 5)
    booking("2026-12-31")
    booking("2027-01-01", completed: false, guests: 4)
    booking("2027-01-01", completed: false, canceled: true)
    booking("2027-01-02", completed: false, guests: 8)
    login!
    get "/api/v1/dashboard"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "date")).to eq("2027-01-01")
    expect(response.parsed_body.dig("data", "summary")).to eq("reservation_count" => 1,
      "expected_guest_count" => 4, "completed_count" => 0, "canceled_count" => 1,
      "unassigned_count" => 1, "unconfirmed_count" => 1)
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    expect(data["period"]).to include("current_month" => "2027-01", "year" => 2027, "through" => "2027-01-01")
    expect(data["kpis"]).to include("monthly_reservations" => 2, "annual_visits" => 0,
      "new_customers" => 0, "returning_customer_ratio" => nil)
    expect(data["monthly_series"].last(2)).to eq([
      { "month" => "2026-12", "reservations" => 1, "visits" => 1 },
      { "month" => "2027-01", "reservations" => 2, "visits" => 0 }
    ])
  end

  it "同日の複数来店を別日の再来店とせず、取消・未完了を初回来店にしない" do
    customer = create(:customer)
    booking("2026-10-01", customer: customer, completed: false, canceled: true)
    booking("2026-10-02", customer: customer, completed: false)
    booking("2026-11-01", customer: customer)
    booking("2026-11-01", customer: customer, hour: 21)
    login!
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "kpis")).to include("new_customers" => 1,
      "annual_visits" => 2, "monthly_customer_count" => 1, "returning_customer_count" => 0,
      "returning_customer_ratio" => 0.0)
    expect(response.parsed_body.dig("data", "insights", "new_returning", "count")).to eq(0)
  end

  it "90日ちょうどを除外し91日からご無沙汰にするが非表示顧客を接客候補に出さない" do
    [ 90, 91 ].each do |days|
      customer = create(:customer)
      [ days + 90, days + 60, days + 30, days ].each { |offset| booking(Date.current - offset, customer: customer) }
    end
    hidden = create(:customer, hidden_at: Time.current)
    [ 180, 150, 120, 91 ].each { |offset| booking(Date.current - offset, customer: hidden) }
    login!
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    expect(data.dig("kpis", "annual_visits")).to eq(12)
    expect(data.dig("kpis", "overdue_customers")).to eq(1)
    expect(data.dig("insights", "regular", "count")).to eq(2)
    expect(data.dig("insights", "overdue", "count")).to eq(1)
    expect(data["insights"].values.flat_map { |group| group["customers"] }.map { |row| row["id"] }).not_to include(hidden.id)
  end

  it "間隔中央値の1.5倍ちょうどを除外し超過後に抽出する" do
    customer = create(:customer)
    %w[2026-10-02 2026-10-12 2026-10-22 2026-11-01].each { |day| booking(day, customer: customer) }
    at_boundary = Dashboard::Analytics.call(now: Time.zone.local(2026, 11, 16, 23))
    after_boundary = Dashboard::Analytics.call(now: Time.zone.local(2026, 11, 17, 23))
    expect(at_boundary.dig(:insights, :slowing, :count)).to eq(0)
    expect(after_boundary.dig(:insights, :slowing, :customers).first).to include(id: customer.id, median_interval_days: 10.0, days_since_visit: 16)
  end

  it "接客候補の全人数と最大5名の表示対象を区別する" do
    7.times do
      customer = create(:customer)
      [ 180, 150, 120, 100 ].each { |offset| booking(Date.current - offset, customer: customer) }
    end
    login!
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok)
    group = response.parsed_body.dig("data", "insights", "regular")
    expect(group["count"]).to eq(7)
    expect(group["customers"].size).to eq(5)
    expect(group["customers"].map { |row| row["id"] }).to eq(Customer.order(:id).limit(5).pluck(:id))
  end

  it "閲覧専用ユーザーにも本日集計と分析を返す" do
    login_staff.staff_master.update!(role_code: "viewer")
    login!
    %w[dashboard dashboard_analytics].each do |path|
      get "/api/v1/#{path}"
      expect(response).to have_http_status(:ok)
    end
  end
end
