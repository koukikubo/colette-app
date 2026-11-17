require "rails_helper"

RSpec.describe "RFルールの来店履歴なしランク設定", type: :request do
  include_context "authenticated request"

  let(:login_staff) do
    create(:staff,
           staff_master: create(:staff_master, role_code: "owner"),
           password: login_password,
           password_confirmation: login_password)
  end
  let(:master) { create(:standard_master, system_key: "rf_rank") }
  let(:rank) { create(:standard_list_master, standard_master: master, code: nil) }
  let(:attributes) do
    {
      name: "来店履歴なし設定確認",
      aggregation_months: 60,
      frequency_window_months: 12,
      no_visit_rank_id: rank.id,
      recency_rules: [],
      frequency_rules: [],
      rank_mappings: []
    }
  end

  before { login! }

  def create_rule_set(overrides = {})
    post "/api/v1/rf_rule_sets",
         params: { rf_rule_set: attributes.merge(overrides) },
         headers: authenticated_headers, as: :json
  end

  def update_rule_set(rule_set, overrides = {})
    patch "/api/v1/rf_rule_sets/#{rule_set.id}",
          params: {
            rf_rule_set: attributes.except(:no_visit_rank_id).merge(
              lock_version: rule_set.lock_version,
              **overrides
            )
          },
          headers: authenticated_headers, as: :json
  end

  it "旧コードのないランクをIDで保存し、詳細APIで返す" do
    create_rule_set
    expect(response).to have_http_status(:created)
    rule_set = RfRuleSet.last
    expect(rule_set.no_visit_rank).to eq(rank)
    expect(response.parsed_body.dig("data", "rule_set", "no_visit_rank_id")).to eq(rank.id)

    get "/api/v1/rf_rule_sets/#{rule_set.id}", headers: authenticated_headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "rule_set", "no_visit_rank_id")).to eq(rank.id)
  end

  it "RFランク以外のIDは保存しない" do
    other_rank = create(:standard_list_master)

    expect { create_rule_set(no_visit_rank_id: other_rank.id) }
      .not_to change(RfRuleSet, :count)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "存在しないIDは入力エラーとして返す" do
    missing_id = StandardListMaster.maximum(:id).to_i + 1

    expect { create_rule_set(no_visit_rank_id: missing_id) }
      .not_to change(RfRuleSet, :count)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "更新時にIDを省略しても保存済みの設定を保持する" do
    create_rule_set
    rule_set = RfRuleSet.last

    update_rule_set(rule_set, name: "改名後")

    expect(response).to have_http_status(:ok)
    expect(rule_set.reload.no_visit_rank_id).to eq(rank.id)
  end

  it "別のRFランクへ変更でき、他のルールには影響しない" do
    create_rule_set
    first_rule = RfRuleSet.last
    create_rule_set
    second_rule = RfRuleSet.last
    other_rank = create(:standard_list_master, standard_master: master, code: nil)

    update_rule_set(second_rule, no_visit_rank_id: other_rank.id)

    expect(response).to have_http_status(:ok)
    expect(second_rule.reload.no_visit_rank_id).to eq(other_rank.id)
    expect(first_rule.reload.no_visit_rank_id).to eq(rank.id)
  end

  it "下書きでは設定を未選択に戻せる" do
    create_rule_set
    rule_set = RfRuleSet.last

    update_rule_set(rule_set, no_visit_rank_id: nil)

    expect(response).to have_http_status(:ok)
    expect(rule_set.reload.no_visit_rank_id).to be_nil
  end
end
