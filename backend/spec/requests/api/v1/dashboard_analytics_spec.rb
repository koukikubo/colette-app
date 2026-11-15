require "rails_helper"
RSpec.describe "店舗と顧客の分析", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  let(:seat_type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }
  before { travel_to Time.zone.local(2026, 11, 15, 23) }
  after { travel_back }

  def booking(day, customer: nil, completed: true, canceled: false)
    start = Time.zone.parse("#{day} 18:00")
    create(:reservation, customer: customer, requested_restaurant_master_type: seat_type, reservation_status: status,
      created_by_staff: login_staff, updated_by_staff: login_staff, starts_at: start, ends_at: start + 2.hours,
      completed_at: completed ? Time.current : nil, canceled_at: canceled ? Time.current : nil)
  end

  it "未認証は401で拒否する" do
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:unauthorized)
  end

  it "履歴がないと比率はnull、RFは未計算、人数を捏造しない" do
    login!
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    expect(data.dig("kpis", "returning_customer_ratio")).to be_nil
    expect(data["rf"]).to be_nil
    expect(data["monthly_series"].size).to eq(12)
    expect(data["insights"].values.map { |group| group["count"] }).to eq([ 0, 0, 0, 0 ])
  end

  it "実来店と予定・キャンセルを分け、再来店比率の分母を顧客単位で数える" do
    login!
    first = create(:customer)
    regular = create(:customer)
    booking("2026-11-01", customer: first)
    booking("2026-11-08", customer: first)
    booking("2026-10-01", customer: regular)
    booking("2026-11-10", customer: regular)
    booking("2026-11-14") # 顧客未確定の実来店は件数に含み、顧客比率には含めない。
    booking("2026-11-20", customer: regular, completed: false)
    booking("2026-11-21", customer: regular, completed: false, canceled: true)
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("data")
    expect(data["kpis"]).to include("monthly_reservations" => 5, "annual_visits" => 5,
      "new_customers" => 1, "monthly_customer_count" => 2, "returning_customer_count" => 2, "returning_customer_ratio" => 100.0)
    expect(data["monthly_series"].last).to include("month" => "2026-11", "reservations" => 5, "visits" => 4)
    expect(data.dig("insights", "new_returning", "customers").map { |row| row["id"] }).to eq([ first.id ])
  end

  it "承認された常連・90日超・間隔中央値の基準で集計する" do
    login!
    frequent = create(:customer)
    [ "2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01" ].each { |day| booking(day, customer: frequent) }
    insufficient = create(:customer)
    booking("2026-04-01", customer: insufficient)
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("data")
    %w[regular overdue slowing].each do |key|
      expect(data.dig("insights", key, "count")).to eq(1)
      expect(data.dig("insights", key, "customers").first["id"]).to eq(frequent.id)
    end
    expect(data.dig("insights", "slowing", "customers").first["median_interval_days"]).to eq(31.0)
  end
  it "顧客が増えても集計SQLの発行数を増やさない" do
    first = create(:customer)
    booking("2026-11-01", customer: first)
    query_count = lambda do
      count = 0
      callback = ->(*args) { payload = args.last; count += 1 unless %w[SCHEMA TRANSACTION].include?(payload[:name]) }
      ActiveRecord::Base.uncached do
        ActiveSupport::Notifications.subscribed(callback, "sql.active_record") { Dashboard::Analytics.call }
      end
      count
    end
    initial_count = query_count.call
    second = create(:customer)
    booking("2026-11-02", customer: second)
    expect(query_count.call).to eq(initial_count)
  end
end
