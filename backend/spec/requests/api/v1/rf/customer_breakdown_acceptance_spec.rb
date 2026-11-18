require "rails_helper"

RSpec.describe "固定RF履歴の顧客内訳の受入", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"
  before { login! }

  # 新しい適用結果ができても、リクエストで指定した履歴を変えない。
  def fetch_list(**filters)
    get "/api/v1/rf_customers", params: { run_id: current_run.id, **filters }
  end

  it "別カテゴリ・履歴にないランクを空結果として処理せず拒否する" do
    RfSetting.create!(current_calculation_run: current_run)
    unknown = create(:standard_list_master)
    [ unknown.id, 999_999_999 ].each do |id|
      fetch_list(rf_rank_id: id)
      expect(response).to have_http_status(:bad_request)
      fetch_list(comparison_run_id: previous_run.id, from_rank_id: id)
      expect(response).to have_http_status(:bad_request)
      fetch_list(comparison_run_id: previous_run.id, to_rank_id: id)
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "履歴内の有効な条件で0件なら空結果を返す" do
    RfSetting.create!(current_calculation_run: current_run)
    fetch_list(rf_rank_id: rank_a.id)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "customers")).to eq([])
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(0)
  end

  it "適用履歴とマスタが変わっても選択した履歴の名称と結果を保持する" do
    customer = customer_with_change(from: rank_a, to: rank_b)
    saved_label = rank_b.label
    newer = history_on("2026-11-15", previous: current_run)
    add_history_result(newer, customer, rank: rank_a)
    RfSetting.create!(current_calculation_run: newer)
    rank_b.update!(label: "現在の変更済み名称", position: 50)
    fetch_list(rf_rank_id: rank_b.id)
    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    expect(data["run"]).to include("id" => current_run.id, "base_date" => "2026-11-01")
    expect(data["customers"].sole).to include("customer_id" => customer.id, "last_visit_on" => "2026-10-01", "frequency_count" => 1)
    expect(data["customers"].sole["to_rank"]).to include("label" => saved_label, "position" => 2)
  end

  it "未完了・未適用履歴と片方だけのセル条件を拒否する" do
    RfSetting.create!(current_calculation_run: current_run)
    draft = history_on("2026-11-15", previous: current_run, status: "processing")
    fetch_list(run_id: draft.id)
    expect(response).to have_http_status(:not_found)
    fetch_list(recency_rule_id: 1)
    expect(response).to have_http_status(:bad_request)
    fetch_list(frequency_rule_id: 1)
    expect(response).to have_http_status(:bad_request)
  end

  it "3,000件のランク・セル・変動内訳が集計と一致し、末尾100件だけ実体化する" do
    template = history_customer.attributes.except("id")
    ids = Customer.insert_all!(Array.new(3_000) { template }, returning: %w[id]).rows.flatten.sort
    CustomerRfRankResult.insert_all!(ids.map { |id| { customer_id: id, rf_calculation_run_id: current_run.id, rf_rank_id: rank_a.id, frequency_count: 2, recency_days: 31, last_visit_on: Date.new(2026, 10, 1) } })
    CustomerRfRankResult.insert_all!(ids.map { |id| { customer_id: id, rf_calculation_run_id: previous_run.id, rf_rank_id: rank_b.id, frequency_count: 2 } })
    add_history_result(current_run, history_customer, rank: rank_b)
    RfSetting.create!(current_calculation_run: current_run)
    recency = rule_set.recency_rules.create!(code: "R1", label: "60日以内", position: 1, min_days: 0, max_days: 60)
    frequency = rule_set.frequency_rules.create!(code: "F1", label: "2回", position: 1, min_visits: 2, max_visits: 2)
    expect(Rf::RunPopulationRowBuilder.call(calculation_run: current_run)[:ranks].find { |row| row[:id] == rank_a.id }[:count]).to eq(3_000)
    expect(Rf::CustomerMovementSummary.call(calculation_run: current_run, comparison_run: previous_run).dig(:counts, :up)).to eq(3_000)
    [ { rf_rank_id: rank_a.id }, { recency_rule_id: recency.id, frequency_rule_id: frequency.id },
      { comparison_run_id: previous_run.id, category: "up" } ].each do |filters|
      instantiated = 0
      listener = ->(*args) { payload = args.last; instantiated += payload[:record_count] if payload[:class_name] == "Customer" }
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      ActiveSupport::Notifications.subscribed(listener, "instantiation.active_record") { fetch_list(**filters, page: 30, per_page: 100) }
      elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
      expect(response).to have_http_status(:ok), response.body
      data = response.parsed_body.fetch("data")
      expect(data["pagination"]).to include("total_count" => 3_000, "total_pages" => 30)
      expect(data["customers"].map { |row| row["customer_id"] }).to eq(ids.last(100))
      expect(instantiated).to eq(100)
      RSpec.configuration.reporter.message("RF内訳3,000件 #{filters.keys.join('/')} page=30 per_page=100 customers_loaded=#{instantiated} response_seconds=#{elapsed.round(4)}")
    end
  end
end
