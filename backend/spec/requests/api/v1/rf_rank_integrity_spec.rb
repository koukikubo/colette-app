require "rails_helper"

RSpec.describe "rf_rank_integrity", type: :request do
  include_context "authenticated request"
  let(:login_staff) { create(:staff, staff_master: create(:staff_master, role_code: "owner")) }
  before { login! }

  it "使用中の未訪問ランクを停止するAPI更新は422で拒否し計算を継続できる" do
    master = create(:standard_master, system_key: "rf_rank")
    rank = create(:standard_list_master, standard_master: master)
    rule = RfRuleSet.create!(name: "保護対象", version: 1, status: "published", aggregation_months: 60, frequency_window_months: 12, no_visit_rank: rank)
    customer = create(:customer)
    patch "/api/v1/standard_masters/#{master.id}/items/#{rank.id}", params: { standard_list_master: { active: false } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("errors", "active")).to be_present
    expect(Rf::CustomerRankCalculator.call(customer: customer, rule_set: rule, base_date: Date.current).rf_rank).to eq(rank)
  end
end
