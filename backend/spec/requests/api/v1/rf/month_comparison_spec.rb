require "rails_helper"

RSpec.describe "RF month comparison", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  let(:rule_set) { RfRuleSet.create!(name: "比較", version: 1, aggregation_months: 60, frequency_window_months: 12) }
  let(:master) { create(:standard_master, system_key: "rf_rank") }
  let(:rank_a) { create(:standard_list_master, standard_master: master, position: 1) }
  let(:rank_b) { create(:standard_list_master, standard_master: master, position: 2) }
  let(:customer) { create(:customer) }

  def run_on(date, previous: nil, rank: rank_a, rules: rule_set, status: "completed")
    date = Date.iso8601(date)
    run = RfCalculationRun.create!(
      rf_rule_set: rules, base_date: date, previous_run: previous, status: status,
      aggregation_started_on: date - 60.months, frequency_started_on: date - 12.months,
      rf_rank_snapshots: [ rank_a, rank_b ].map do |r|
        { "id" => r.id, "display_code" => r.display_code, "label" => r.label,
          "display_color" => r.display_color, "position" => r.position }
      end
    )
    run.customer_rf_rank_results.create!(customer: customer, rf_rank: rank, frequency_count: 1)
    run
  end

  def compare(start_month = "2026-07", end_month = "2026-09")
    get "/api/v1/rf_customer_transitions/compare", params: { start_month: start_month, end_month: end_month }
  end

  before { travel_to Time.zone.local(2026, 10, 30) }
  after { travel_back }

  it "requires authentication" do
    compare
    expect(response).to have_http_status(:unauthorized)
  end

  it "compares A→B→A as unchanged without writing applied ranks or history" do
    login!
    first = run_on("2026-07-31")
    middle = run_on("2026-08-31", previous: first, rank: rank_b)
    last = run_on("2026-09-30", previous: middle)
    setting = RfSetting.create!(current_calculation_run: last)
    before_customer = customer.reload.attributes
    expect { compare }.not_to change(RfCalculationRun, :count)
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    expect(data.fetch("start_run").fetch("id")).to eq(first.id)
    expect(data.fetch("end_run").fetch("id")).to eq(last.id)
    expect(data.dig("movement", "counts", "unchanged")).to eq(1)
    expect(data.dig("movement", "counts", "up")).to eq(0)
    expect(customer.reload.attributes).to eq(before_customer)
    expect(setting.reload.current_calculation_run_id).to eq(last.id)
  end

  it "selects latest base date then ID, excluding unapplied runs" do
    login!
    first = run_on("2026-07-01")
    second = run_on("2026-07-31", previous: first)
    third = run_on("2026-07-31", previous: second)
    last = run_on("2026-09-20", previous: third, rank: rank_b)
    run_on("2026-09-30", previous: last)
    RfSetting.create!(current_calculation_run: last)
    compare
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "start_run", "id")).to eq(third.id)
    expect(response.parsed_body.dig("data", "end_run", "base_date")).to eq("2026-09-20")
    expect(response.parsed_body.dig("data", "movement", "counts", "down")).to eq(1)
  end

  it "supports identical months" do
    login!
    RfSetting.create!(current_calculation_run: run_on("2026-09-30"))
    compare("2026-09", "2026-09")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "movement", "counts", "unchanged")).to eq(1)
  end

  it "reports missing monthly history without carrying another month forward" do
    login!
    RfSetting.create!(current_calculation_run: run_on("2026-09-30"))
    compare
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("errors").join).to include("2026-07")
  end

  it "reports no applied history" do
    login!
    compare
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "does not compare history outside the restored chain" do
    login!
    first = run_on("2026-07-31")
    run_on("2026-09-30", previous: first)
    RfSetting.create!(current_calculation_run: first)
    compare
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("errors").join).to include("2026-09")
  end

  it "ignores incomplete runs" do
    login!
    first = run_on("2026-07-31")
    failed = run_on("2026-09-30", previous: first, status: "failed")
    RfSetting.create!(current_calculation_run: run_on("2026-10-20", previous: failed))
    compare
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("errors").join).to include("2026-09")
  end

  it "rejects changed rules" do
    login!
    first = run_on("2026-07-31")
    other = RfRuleSet.create!(name: "変更", version: 2, aggregation_months: 60, frequency_window_months: 12)
    RfSetting.create!(current_calculation_run: run_on("2026-09-30", previous: first, rules: other))
    compare
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("errors").join).to include("RFルールが異なる")
  end

  it "rejects invalid, reversed and future months" do
    login!
    [ [ "invalid", "2026-09" ], [ "2026-09", "2026-07" ], [ "2026-07", "2026-11" ] ].each do |months|
      compare(*months)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  it "marks current month provisional and excludes future base dates" do
    login!
    first = run_on("2026-10-20")
    last = run_on("2026-10-31", previous: first)
    RfSetting.create!(current_calculation_run: last)
    compare("2026-10", "2026-10")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "provisional")).to be(true)
    expect(response.parsed_body.dig("data", "end_run", "id")).to eq(first.id)
  end
end
