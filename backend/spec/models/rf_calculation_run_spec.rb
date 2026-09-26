require "rails_helper"

RSpec.describe RfCalculationRun, type: :model do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "標準RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  subject(:calculation_run) do
    described_class.new(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 9, 21),
      aggregation_started_on: Date.new(2021, 9, 21),
      frequency_started_on: Date.new(2025, 9, 21)
    )
  end

  it "正しい集計期間であれば有効" do
    expect(calculation_run).to be_valid
  end

  it "全体集計開始日が来店回数集計開始日より後の場合は無効" do
    calculation_run.aggregation_started_on =
      Date.new(2026, 1, 1)

    calculation_run.frequency_started_on =
      Date.new(2025, 9, 21)

    expect(calculation_run).not_to be_valid
    expect(
      calculation_run.errors[:aggregation_started_on]
    ).to be_present
  end

  it "来店回数集計開始日が基準日より後の場合は無効" do
    calculation_run.frequency_started_on =
      Date.new(2026, 9, 22)

    expect(calculation_run).not_to be_valid
    expect(
      calculation_run.errors[:frequency_started_on]
    ).to be_present
  end
end
