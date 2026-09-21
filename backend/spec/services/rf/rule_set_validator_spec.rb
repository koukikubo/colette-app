require "rails_helper"

RSpec.describe Rf::RuleSetValidator do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "標準RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  let(:rf_rank_master) do
    create(
      :standard_master,
      system_key: "rf_rank",
      name: "RFランク"
    )
  end

  let(:rf_rank) do
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "rank-1",
      label: "ランク1"
    )
  end

  before do
    @r1 = RfRecencyRule.create!(
      rf_rule_set: rule_set,
      code: "R1",
      label: "90日以内",
      min_days: 0,
      max_days: 90,
      position: 1
    )

    @r2 = RfRecencyRule.create!(
      rf_rule_set: rule_set,
      code: "R2",
      label: "91日以上",
      min_days: 91,
      max_days: nil,
      position: 2
    )

    @f1 = RfFrequencyRule.create!(
      rf_rule_set: rule_set,
      code: "F1",
      label: "2回以下",
      min_visits: 0,
      max_visits: 2,
      position: 1
    )

    @f2 = RfFrequencyRule.create!(
      rf_rule_set: rule_set,
      code: "F2",
      label: "3回以上",
      min_visits: 3,
      max_visits: nil,
      position: 2
    )

    [ @r1, @r2 ].product([ @f1, @f2 ]).each do |recency, frequency|
      RfRankMapping.create!(
        rf_rule_set: rule_set,
        rf_recency_rule: recency,
        rf_frequency_rule: frequency,
        rf_rank: rf_rank
      )
    end
  end

  describe ".call" do
    it "範囲が連続し、すべての組み合わせが設定されていれば有効になる" do
      result = described_class.call(rule_set)

      expect(result).to be_valid
      expect(result.errors).to be_empty
    end

    it "R条件に空白がある場合は無効になる" do
      @r2.update!(min_days: 100)

      result = described_class.call(rule_set)

      expect(result.error_codes).to include(:recency_gap)
    end

    it "F条件が重複している場合は無効になる" do
      @f2.update!(min_visits: 2)

      result = described_class.call(rule_set)

      expect(result.error_codes).to include(:frequency_overlap)
    end

    it "最後のR条件に上限が設定されている場合は無効になる" do
      @r2.update!(max_days: 365)

      result = described_class.call(rule_set)

      expect(result.error_codes).to include(:recency_upper_limit)
    end

    it "RとFの組み合わせが不足している場合は無効になる" do
      rule_set.rank_mappings.last.destroy!

      result = described_class.call(rule_set)

      expect(result.error_codes).to include(:mapping_missing)
    end

    it "無効なRFランクを使用している場合は無効になる" do
      rf_rank.update!(active: false)

      result = described_class.call(rule_set)

      expect(result.error_codes).to include(:inactive_rf_rank)
    end
  end
end
