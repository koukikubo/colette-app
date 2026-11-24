require "rails_helper"

RSpec.describe "顧客検索と来店分析", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  before { travel_to Time.zone.local(2026, 11, 24, 23) }
  after { travel_back }
  let(:seat_type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }

  def visit(customer, date, **attributes)
    starts_at = Time.zone.parse("#{date} 18:00")
    create(:reservation, customer: customer, requested_restaurant_master_type: seat_type, reservation_status: status,
      starts_at: starts_at, ends_at: starts_at + 2.hours, completed_at: Time.current, **attributes)
  end

  it "未認証の分析取得は401にする" do
    get "/api/v1/customer_analytics"
    expect(response).to have_http_status(:unauthorized)
  end

  it "表示中の退店実績だけで今月の集計と12か月ランキングを返す" do
    login!
    regular = create(:customer)
    fresh = create(:customer)
    hidden = create(:customer, hidden_at: Time.current)
    visit(regular, "2026-10-01")
    visit(regular, "2026-11-01")
    visit(fresh, "2026-11-02")
    visit(hidden, "2026-11-03")
    visit(fresh, "2026-11-05", completed_at: nil)
    visit(fresh, "2026-11-06", completed_at: nil, canceled_at: Time.current, cancellation_kind: "no_show")
    visit(fresh, "2026-11-07", completed_at: nil, canceled_at: Time.current, cancellation_kind: "regular")
    visit(fresh, "2026-11-25", completed_at: nil)
    get "/api/v1/customer_analytics"
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("data")
    expect(data.fetch("summary")).to include("customer_count" => 2, "monthly_visits" => 2,
      "monthly_customers" => 2, "returning_customers" => 1, "returning_ratio" => 50.0)
    expect(data.fetch("ranking").map { |row| row["id"] }).to eq([ regular.id, fresh.id ])
    expect(data.fetch("ranking").first.fetch("visit_count")).to eq(2)
  end

  it "履歴なしの再来店率を捏造せず、ランキングは最大10人にする" do
    login!
    get "/api/v1/customer_analytics"
    expect(response.parsed_body.dig("data", "summary", "returning_ratio")).to be_nil
    12.times { |index| visit(create(:customer), "2026-11-#{index + 1}") }
    get "/api/v1/customer_analytics"
    expect(response.parsed_body.dig("data", "ranking").length).to eq(10)
  end

  it "キーワード・区分・最終来店日・12か月回数をANDで絞り、総件数も一致する" do
    login!
    selected = create(:customer, name: "検索対象", kana: "ケンサクタイショウ")
    other = create(:customer, name: "検索対象 二", kana: "ケンサクタイショウニ")
    visit(selected, "2026-10-01")
    visit(selected, "2026-11-01")
    visit(other, "2026-11-02")
    get "/api/v1/customers", params: { query: "検索対象", customer_kind: "individual",
      last_visit_from: "2026-11-01", last_visit_to: "2026-11-01", min_visits: 2, max_visits: 3, per_page: 1 }
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "customers").pluck("id")).to eq([ selected.id ])
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(1)
    get "/api/v1/customers", params: { max_visits: 0 }
    expect(response.parsed_body.dig("data", "customers")).to eq([])
  end

  it "来店のない顧客を0回として検索でき、不正な条件を400で拒否する" do
    login!
    customer = create(:customer)
    get "/api/v1/customers", params: { min_visits: 0, max_visits: 0 }
    expect(response.parsed_body.dig("data", "customers").pluck("id")).to eq([ customer.id ])
    [ { min_visits: -1 }, { max_visits: "1 OR 1=1" }, { min_visits: 3, max_visits: 2 },
      { last_visit_from: "2026-02-30" }, { last_visit_from: "0000-01-01" }, { last_visit_from: "2026-11-02", last_visit_to: "2026-11-01" } ].each do |filters|
      get "/api/v1/customers", params: filters
      expect(response).to have_http_status(:bad_request), filters.inspect
    end
  end
  it "同日の複数来店は件数に含めるが、別日でないため再来店にはしない" do
    login!
    customer = create(:customer)
    visit(customer, "2026-11-01", starts_at: Time.zone.parse("2026-11-01 17:00"), ends_at: Time.zone.parse("2026-11-01 19:00"))
    visit(customer, "2026-11-01", starts_at: Time.zone.parse("2026-11-01 19:00"), ends_at: Time.zone.parse("2026-11-01 21:00"))
    visit(customer, "2026-11-02", completed_at: Time.current + 1.day)
    get "/api/v1/customer_analytics"
    expect(response.parsed_body.dig("data", "summary")).to include("monthly_visits" => 2, "returning_customers" => 0, "returning_ratio" => 0.0)
  end

  it "集計SQL数は顧客数に比例せず、viewerも参照できる" do
    login_staff.staff_master.update!(role_code: "viewer")
    login!
    query_count = lambda do
      queries = []
      callback = ->(*args) { queries << args.last[:sql] unless %w[SCHEMA TRANSACTION].include?(args.last[:name]) }
      ActiveRecord::Base.uncached do
        ActiveSupport::Notifications.subscribed(callback, "sql.active_record") { Customers::Analytics.call }
      end
      queries.size
    end
    initial = query_count.call
    3.times { visit(create(:customer), "2026-11-01") }
    expect(query_count.call).to eq(initial)
    get "/api/v1/customer_analytics"
    expect(response).to have_http_status(:ok)
  end

  it "3,000顧客の検索と末尾ページをDBで処理し100件だけ返す" do
    login!
    template = create(:customer).attributes.except("id")
    ids = Customer.insert_all!(Array.new(3_000) { template }, returning: %w[id]).rows.flatten
    starts_at = Time.zone.parse("2026-11-01 18:00")
    booking = build(:reservation, requested_restaurant_master_type: seat_type, reservation_status: status,
      created_by_staff: login_staff, updated_by_staff: login_staff, starts_at: starts_at, ends_at: starts_at + 2.hours,
      completed_at: Time.current).attributes.except("id").merge("created_at" => Time.current, "updated_at" => Time.current)
    Reservation.insert_all!(ids.map { |id| booking.merge("customer_id" => id) })
    get "/api/v1/customers", params: { min_visits: 1, max_visits: 1, page: 30, per_page: 100 }
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(3_000)
    expect(response.parsed_body.dig("data", "customers").pluck("id")).to eq(ids.sort.reverse.last(100))
  end
end
