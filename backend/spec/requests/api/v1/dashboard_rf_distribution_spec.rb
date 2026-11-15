require "rails_helper"
RSpec.describe "ダッシュボードの適用済みRF分布", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"

  it "現在適用中の履歴に固定し、マスタ変更後も保存済みの表示名で人数を返す" do
    login!
    run = current_run
    label = rank_a.label
    add_history_result(run, history_customer, rank: rank_a)
    add_history_result(run, history_customer, reason: "manual_customer_rank")
    RfSetting.create!(current_calculation_run: run)
    rank_a.update!(label: "変更後の表示名")
    get "/api/v1/dashboard_analytics"
    expect(response).to have_http_status(:ok), response.body
    rf = response.parsed_body.dig("data", "rf")
    expect(rf).to include("calculation_run_id" => run.id, "excluded_count" => 1)
    expect(rf["ranks"].find { |rank| rank["id"] == rank_a.id }).to include("label" => label, "count" => 1)
  end
end
