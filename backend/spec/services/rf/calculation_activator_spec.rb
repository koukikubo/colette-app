require "rails_helper"

RSpec.describe Rf::CalculationActivator do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  it "計算完了済みの履歴を現在値に設定する" do
    calculation_run = create_run(status: "completed")

    setting =
      described_class.call(
        calculation_run: calculation_run
      )

    expect(
      setting.current_calculation_run
    ).to eq(calculation_run)
  end

  it "計算途中の履歴は適用できない" do
    calculation_run = create_run(status: "processing")

    expect do
      described_class.call(
        calculation_run: calculation_run
      )
    end.to raise_error(
      Rf::CalculationActivator::IncompleteRunError
    )
  end

  it "現在値と接続していない古い計算結果は適用できない" do
    current_run = create_run(status: "completed")

    RfSetting.create!(
      current_calculation_run: current_run
    )

    stale_run = create_run(
      status: "completed",
      previous_run: nil
    )

    expect do
      described_class.call(
        calculation_run: stale_run
      )
    end.to raise_error(
      Rf::CalculationActivator::StaleRunError
    )
  end

  private

  def create_run(status:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: Date.new(2026, 9, 21),
      aggregation_started_on: Date.new(2021, 9, 21),
      frequency_started_on: Date.new(2025, 9, 21),
      status: status,
      completed_at: status == "completed" ? Time.current : nil
    )
  end
end
