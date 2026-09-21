require "rails_helper"

RSpec.describe Rf::CalculationRollback do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  it "現在値をひとつ前の計算結果へ戻す" do
    previous_run = create_run
    current_run = create_run(previous_run: previous_run)

    setting =
      RfSetting.create!(
        current_calculation_run: current_run
      )

    described_class.call

    expect(
      setting.reload.current_calculation_run
    ).to eq(previous_run)
  end

  it "現在値がない場合は復元できない" do
    expect do
      described_class.call
    end.to raise_error(
      Rf::CalculationRollback::CurrentRunNotFoundError
    )
  end

  it "以前の計算結果がない場合は復元できない" do
    current_run = create_run

    RfSetting.create!(
      current_calculation_run: current_run
    )

    expect do
      described_class.call
    end.to raise_error(
      Rf::CalculationRollback::PreviousRunNotFoundError
    )
  end

  private

  def create_run(previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: Date.new(2026, 9, 21),
      aggregation_started_on: Date.new(2021, 9, 21),
      frequency_started_on: Date.new(2025, 9, 21),
      status: "completed",
      completed_at: Time.current
    )
  end
end
