require "rails_helper"

RSpec.describe "日次RFの並行実行", type: :model do
  include_context "independent integrity connections"

  after do
    if @monthly_rule
      ids = RfCalculationRun.where(rf_rule_set: @monthly_rule).pluck(:id)
      RfSetting.where(current_calculation_run_id: ids).delete_all
      CustomerRfRankResult.where(rf_calculation_run_id: ids).delete_all
      RfCalculationRun.where(id: ids).delete_all
    end
  end

  it "独立した接続から同じ日を起動しても計算履歴と適用は一つだけ" do
    master = tracked(:standard_master, system_key: "rf_rank")
    rank = tracked(:standard_list_master, standard_master: master)
    @monthly_rule = RfRuleSet.create!(name: @marker, version: 1, status: "published", aggregation_months: 60, frequency_window_months: 12, no_visit_rank: rank)
    @records << @monthly_rule
    recency = @monthly_rule.recency_rules.create!(code: "R", label: "R", min_days: 0, position: 1)
    frequency = @monthly_rule.frequency_rules.create!(code: "F", label: "F", min_visits: 0, position: 1)
    mapping = @monthly_rule.rank_mappings.create!(rf_recency_rule: recency, rf_frequency_rule: frequency, rf_rank: rank)
    @records.concat([ recency, frequency, mapping ])
    period = Date.current.iso8601
    ids = concurrently { Rf::DailyUpdater.call(date: period).id }
    expect(ids.uniq.size).to eq(1)
    run = RfCalculationRun.find(ids.first)
    expect(run.monthly_apply_state).to eq("applied")
    expect(RfSetting.first.current_calculation_run_id).to eq(run.id)
    expect(RfSetting.first.lock_version).to eq(1)
    expect(RfCalculationRun.where(scheduled_on: period).count).to eq(1)
  end
end
