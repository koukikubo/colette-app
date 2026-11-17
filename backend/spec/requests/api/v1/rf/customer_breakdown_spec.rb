require "rails_helper"

RSpec.describe "RFの顧客内訳", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"
  before { login! }

  def list(**filters)
    get "/api/v1/rf_customers", params: { run_id: current_run.id, **filters }
  end

  it "上昇・下降などの件数と実顧客の内訳が一致する" do
    customer_with_change(from: rank_a, to: rank_b)
    customer_with_change(from: rank_c, to: rank_a)
    customer_with_change(from: rank_a, to: rank_a)
    add_history_result(current_run, history_customer, rank: rank_b)
    add_history_result(previous_run, history_customer, rank: rank_a)
    customer_with_change(from: no_visit_rank, to: rank_b)
    excluded = history_customer
    add_history_result(previous_run, excluded, rank: rank_a)
    add_history_result(current_run, excluded, reason: "manual_customer_rank")
    unmatched = history_customer
    add_history_result(previous_run, unmatched, rank: rank_a)
    add_history_result(current_run, unmatched, reason: "no_matching_rule")
    RfSetting.create!(current_calculation_run: current_run)
    counts = Rf::CustomerMovementSummary.call(calculation_run: current_run, comparison_run: previous_run).fetch(:counts)
    counts.each do |category, count|
      list(comparison_run_id: previous_run.id, category: category)
      expect(response).to have_http_status(:ok), response.body
      expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(count), category.to_s
    end
  end

  it "ランクで絞り込み、ページを移動しても件数と並び順が安定する" do
    customers = 3.times.map { customer_with_change(from: rank_a, to: rank_b) }
    customer_with_change(from: rank_b, to: rank_a)
    RfSetting.create!(current_calculation_run: current_run)
    list(rf_rank_id: rank_b.id, per_page: 2, page: 2)
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(3)
    expect(response.parsed_body.dig("data", "customers").map { |row| row["customer_id"] }).to eq([ customers.last.id ])
  end

  it "移動セルの状態とランクを組み合わせて一致する顧客だけ返す" do
    chosen = customer_with_change(from: rank_a, to: rank_b)
    customer_with_change(from: rank_c, to: rank_b)
    RfSetting.create!(current_calculation_run: current_run)
    list(comparison_run_id: previous_run.id, from_state: "ranked", from_rank_id: rank_a.id, to_state: "ranked", to_rank_id: rank_b.id)
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "customers").map { |row| row["customer_id"] }).to eq([ chosen.id ])
  end

  it "集計セルの実条件を表示名とともに返す" do
    recency = rule_set.recency_rules.create!(code: "R1", label: "90日以内", position: 1, min_days: 0, max_days: 90)
    frequency = rule_set.frequency_rules.create!(code: "F1", label: "1回", position: 1, min_visits: 1, max_visits: 1)
    customer = customer_with_change(from: rank_a, to: rank_b)
    current_run.customer_rf_rank_results.find_by!(customer: customer).update!(recency_days: 31)
    RfSetting.create!(current_calculation_run: current_run)
    list(recency_rule_id: recency.id, frequency_rule_id: frequency.id)
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "cell_labels")).to eq({ "recency" => "90日以内", "frequency" => "1回" })
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(1)
  end

  it "条件IDや分類へのSQL断片を拒否し顧客データを保持する" do
    customer_with_change(from: rank_a, to: rank_b)
    RfSetting.create!(current_calculation_run: current_run)
    expect {
      list(rf_rank_id: "1 OR 1=1")
      expect(response).to have_http_status(:bad_request)
      list(comparison_run_id: previous_run.id, category: "down' OR 1=1 --")
      expect(response).to have_http_status(:bad_request)
    }.not_to change(Customer, :count)
  end

  it "未適用履歴や不正な移動区分を受け付けない" do
    list
    expect(response).to have_http_status(:not_found)
    RfSetting.create!(current_calculation_run: current_run)
    list(category: "invalid")
    expect(response).to have_http_status(:bad_request)
  end
end
