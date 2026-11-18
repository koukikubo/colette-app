require "rails_helper"

RSpec.describe "顧客一覧の現在RFランク", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"
  before { login! }

  def data
    response.parsed_body.fetch("data")
  end

  def activate
    RfSetting.create!(current_calculation_run: current_run)
  end

  it "適用履歴のない状態と、その履歴に顧客結果がない未計算を区別する" do
    customer = history_customer
    get "/api/v1/customers"
    expect(data.fetch("customers").first.fetch("rf_rank_state")).to eq("no_applied_run")
    expect(data.fetch("rf_reference").fetch("calculation_run_id")).to be_nil
    activate
    get "/api/v1/customers"
    row = data.fetch("customers").find { |item| item["id"] == customer.id }
    expect(row.fetch("rf_rank_state")).to eq("not_calculated")
    expect(data.fetch("rf_reference").fetch("calculation_run_id")).to eq(current_run.id)
  end

  it "通常ランク・対象外・未訪問・ルール未一致を区別する" do
    states = { "ranked" => [ rank_a, nil ], "no_visit" => [ no_visit_rank, nil ],
               "excluded" => [ nil, "manual_customer_rank" ], "unmatched" => [ nil, "no_matching_rule" ] }
    expected = states.to_h do |state, (rank, reason)|
      customer = history_customer
      add_history_result(current_run, customer, rank: rank, reason: reason)
      [ customer.id, state ]
    end
    activate
    get "/api/v1/customers"
    expect(data.fetch("customers").to_h { |row| [ row["id"], row.fetch("rf_rank_state") ] }).to eq(expected)
    expected.each do |id, state|
      get "/api/v1/customers", params: { rf_rank_state: state }
      expect(data.fetch("customers").map { |row| row["id"] }).to eq([ id ])
    end
  end

  it "現在マスタ変更後も適用履歴の名称・色を返し、別履歴の結果を混ぜない" do
    customer = customer_with_change(from: rank_b, to: rank_a)
    activate
    snapshot = current_run.rf_rank_snapshots.find { |rank| rank["id"] == rank_a.id }
    rank_a.update!(label: "変更後", display_color: "#123456")
    get "/api/v1/customers", params: { rf_rank_id: rank_a.id }
    row = data.fetch("customers").sole
    expect(row["id"]).to eq(customer.id)
    expect(row.fetch("current_rf_rank")).to include("label" => snapshot["label"], "display_color" => snapshot["display_color"])
    expect(row.fetch("rf_rank_basis").fetch("calculation_run_id")).to eq(current_run.id)
    get "/api/v1/customers", params: { rf_rank_id: rank_b.id }
    expect(data.fetch("pagination").fetch("total_count")).to eq(0)
  end

  it "手動ランクとRFランクを独立して絞り込み、ページ分割前の件数を返す" do
    manual = create(:standard_list_master, standard_master: create(:standard_master, system_key: "customer_rank"))
    chosen = 3.times.map do
      customer = history_customer(customer_rank: manual)
      add_history_result(current_run, customer, rank: rank_a)
      customer
    end
    add_history_result(current_run, history_customer, rank: rank_a)
    activate
    get "/api/v1/customers", params: { customer_rank_id: manual.id, rf_rank_id: rank_a.id, page: 2, per_page: 2 }
    expect(data.fetch("pagination").fetch("total_count")).to eq(3)
    expect(data.fetch("customers").map { |row| row["id"] }).to eq([ chosen.first.id ])
  end

  it "不正ID・他カテゴリ・不正分類・同時指定を400で拒否する" do
    activate
    other = create(:standard_list_master)
    [ { rf_rank_id: "1 OR 1=1" }, { rf_rank_id: -1 }, { rf_rank_id: other.id },
     { rf_rank_state: "unknown" }, { rf_rank_id: rank_a.id, rf_rank_state: "ranked" } ].each do |filters|
      get "/api/v1/customers", params: filters
      expect(response).to have_http_status(:bad_request), filters.inspect
    end
  end

  it "旧履歴にスナップショットがなくても既存のフォールバックで表示する" do
    add_history_result(current_run, history_customer, rank: rank_a)
    current_run.update!(rf_rank_snapshots: nil)
    activate
    get "/api/v1/customers", params: { rf_rank_id: rank_a.id }
    expect(response).to have_http_status(:ok)
    expect(data.fetch("customers").sole.fetch("current_rf_rank").fetch("label")).to eq(rank_a.label)
  end

  it "ページ内の顧客が増えてもRF取得SQLを増やさない" do
    3.times { add_history_result(current_run, history_customer, rank: rank_a) }
    activate
    counts = [ 2, 20 ].map do |per_page|
      queries = []
      subscriber = ->(_name, _start, _finish, _id, payload) { queries << payload[:sql] if payload[:sql].match?(/SELECT.*customer_rf_rank_results/i) }
      ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") do
        get "/api/v1/customers", params: { per_page: per_page }
      end
      queries.size
    end
    expect(counts.first).to be_positive
    expect(counts.last).to eq(counts.first)
  end
  it "3,000件の実結果をDBで絞り込み、末尾ページも100件だけ返す" do
    template = history_customer.attributes.except("id")
    ids = Customer.insert_all!(Array.new(3_000) { template }, returning: %w[id]).rows.flatten
    CustomerRfRankResult.insert_all!(ids.map { |id| { customer_id: id, rf_calculation_run_id: current_run.id, rf_rank_id: rank_a.id, frequency_count: 1 } })
    activate
    get "/api/v1/customers", params: { rf_rank_id: rank_a.id, page: 30, per_page: 100 }
    expect(response).to have_http_status(:ok)
    expect(data.fetch("pagination")).to include("total_count" => 3_000, "total_pages" => 30)
    expect(data.fetch("customers").size).to eq(100)
    expect(data.fetch("customers").map { |row| row["id"] }).to eq(ids.sort.reverse.last(100))
  end
end
