require "rails_helper"

RSpec.describe RfSetting, type: :model do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "標準RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  def create_run(status:)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 9, 21),
      aggregation_started_on: Date.new(2021, 9, 21),
      frequency_started_on: Date.new(2025, 9, 21),
      status: status,
      completed_at: status == "completed" ? Time.current : nil
    )
  end

  it "計算完了済みの履歴を現在値に設定できる" do
    setting = described_class.new(
      current_calculation_run: create_run(status: "completed")
    )

    expect(setting).to be_valid
  end

  it "計算途中の履歴は現在値に設定できない" do
    setting = described_class.new(
      current_calculation_run: create_run(status: "processing")
    )

    expect(setting).not_to be_valid
    expect(
      setting.errors[:current_calculation_run]
    ).to be_present
  end

  it "設定レコードは複数作成できない" do
    described_class.create!(
      current_calculation_run: create_run(status: "completed")
    )

    duplicate = described_class.new(
      current_calculation_run: create_run(status: "completed")
    )

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:singleton_key]).to be_present
  end
end
