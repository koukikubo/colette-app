require "rails_helper"

RSpec.describe "顧客詳細のRF表示整合", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"
  before { login! }

  def detail(customer)
    get "/api/v1/customers/#{customer.id}"
    expect(response).to have_http_status(:ok)
    response.parsed_body.fetch("data").fetch("customer")
  end

  it "一覧と詳細で適用履歴なし・未計算・全分類を一致させる" do
    customer = history_customer
    expect(detail(customer).fetch("rf_rank_state")).to eq("no_applied_run")
    RfSetting.create!(current_calculation_run: current_run)
    expect(detail(customer).fetch("rf_rank_state")).to eq("not_calculated")
    { "ranked" => [ rank_a, nil ], "no_visit" => [ no_visit_rank, nil ],
      "excluded" => [ nil, "manual_customer_rank" ], "unmatched" => [ nil, "no_matching_rule" ] }.each do |state, (rank, reason)|
      record = history_customer
      add_history_result(current_run, record, rank: rank, reason: reason)
      get "/api/v1/customers", params: { rf_rank_state: state }
      row = response.parsed_body.fetch("data").fetch("customers").find { |item| item["id"] == record.id }
      expect(detail(record).slice("current_rf_rank", "rf_rank_state", "rf_rank_basis"))
        .to eq(row.slice("current_rf_rank", "rf_rank_state", "rf_rank_basis"))
    end
  end

  it "マスタ変更後も適用履歴に保存された名称と色を表示する" do
    customer = customer_with_change(from: rank_b, to: rank_a)
    RfSetting.create!(current_calculation_run: current_run)
    snapshot = current_run.rf_rank_snapshots.find { |rank| rank["id"] == rank_a.id }
    rank_a.update!(label: "変更後", display_color: "#123456")
    expect(detail(customer).fetch("current_rf_rank"))
      .to include("label" => snapshot["label"], "display_color" => snapshot["display_color"])
  end

  it "壊れたスナップショットを現在マスタで補って成功にしない" do
    customer = history_customer
    add_history_result(current_run, customer, rank: rank_a)
    current_run.update!(rf_rank_snapshots: [])
    RfSetting.create!(current_calculation_run: current_run)
    get "/api/v1/customers/#{customer.id}"
    expect(response).to have_http_status(:unprocessable_content)
  end
end
