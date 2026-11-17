require "rails_helper"

RSpec.describe "rf_publication_concurrency", type: :model do
  include_context "independent integrity connections"

  it "ランク停止とルール公開が同時でも無効な公開ルールを作らない" do
    category = tracked(:standard_master, system_key: "rf_rank")
    rank = tracked(:standard_list_master, standard_master: category)
    rule = RfRuleSet.create!(name: @marker, version: 1, status: "draft", aggregation_months: 60,
                             frequency_window_months: 12, no_visit_rank: rank)
    @records << rule
    r = rule.recency_rules.create!(code: "R", label: "R", min_days: 0, position: 1)
    f = rule.frequency_rules.create!(code: "F", label: "F", min_visits: 0, position: 1)
    mapping = rule.rank_mappings.create!(rf_recency_rule: r, rf_frequency_rule: f, rf_rank: rank)
    @records.concat([ r, f, mapping ])
    results = concurrently do |index|
      begin
        if index.zero?
          Rf::RuleSetPublisher.call(rule_set: RfRuleSet.find(rule.id), expected_lock_version: 0)
        else
          StandardListMaster.find(rank.id).update!(active: false)
        end
        :success
      rescue ActiveRecord::RecordInvalid
        :rejected
      end
    end
    expect(results.sort).to eq([ :rejected, :success ])
    expect(rule.reload.status == "published" && !rank.reload.active?).to be(false)
  end
end
