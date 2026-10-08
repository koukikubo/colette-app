require "rails_helper"

RSpec.describe RfCalculationRunJob do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "公開済みRFルール",
      version: 1,
      aggregation_months: 24,
      frequency_window_months: 12,
      status: "published",
      published_at: Time.current
    )
  end

  let(:calculation_run) do
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 10, 3),
      aggregation_started_on: Date.new(2024, 10, 3),
      frequency_started_on: Date.new(2025, 10, 3),
      status: "pending"
    )
  end

  it "指定された計算履歴をRunnerへ渡す" do
    allow(Rf::CalculationRunner)
      .to receive(:call)

    described_class.perform_now(calculation_run.id)

    expect(Rf::CalculationRunner)
      .to have_received(:call)
      .with(calculation_run: calculation_run)
      .once
  end
end
