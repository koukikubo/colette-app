require "rails_helper"

RSpec.describe RfRankMapping, type: :model do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "標準RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  let(:recency_rule) do
    RfRecencyRule.create!(
      rf_rule_set: rule_set,
      code: "R1",
      label: "90日以内",
      min_days: 0,
      max_days: nil,
      position: 1
    )
  end

  let(:frequency_rule) do
    RfFrequencyRule.create!(
      rf_rule_set: rule_set,
      code: "F1",
      label: "0回以上",
      min_visits: 0,
      max_visits: nil,
      position: 1
    )
  end

  it "rf_rank以外の基本コードは指定できない" do
    customer_rank_master = create(
      :standard_master,
      system_key: "customer_rank",
      name: "顧客ランク"
    )

    customer_rank = create(
      :standard_list_master,
      standard_master: customer_rank_master,
      code: "R",
      label: "RF対象外"
    )

    mapping = described_class.new(
      rf_rule_set: rule_set,
      rf_recency_rule: recency_rule,
      rf_frequency_rule: frequency_rule,
      rf_rank: customer_rank
    )

    expect(mapping).not_to be_valid
    expect(mapping.errors[:rf_rank]).to be_present
  end

  it "別のルールセットに属するR条件は指定できない" do
    another_rule_set = RfRuleSet.create!(
      name: "別のRFルール",
      version: 2,
      aggregation_months: 60,
      frequency_window_months: 12
    )

    another_recency_rule = RfRecencyRule.create!(
      rf_rule_set: another_rule_set,
      code: "R1",
      label: "別ルール",
      min_days: 0,
      max_days: nil,
      position: 1
    )

    rf_rank_master = create(
      :standard_master,
      system_key: "rf_rank",
      name: "RFランク"
    )

    rf_rank = create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "rank-1",
      label: "ランク1"
    )

    mapping = described_class.new(
      rf_rule_set: rule_set,
      rf_recency_rule: another_recency_rule,
      rf_frequency_rule: frequency_rule,
      rf_rank: rf_rank
    )

    expect(mapping).not_to be_valid
    expect(mapping.errors[:rf_recency_rule]).to be_present
  end
end
