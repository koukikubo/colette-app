require "rails_helper"

RSpec.describe Rf::CalculationRunStarter do
  let(:base_date) do
    Date.new(2026, 10, 3)
  end

  let(:staff) do
    create(:staff)
  end

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

  let(:valid_rule_result) do
    Rf::RuleSetValidator::Result.new(
      errors: [],
      warnings: []
    )
  end

  before do
    allow(Rf::RuleSetValidator)
      .to receive(:call)
      .and_return(valid_rule_result)

    allow(RfCalculationRunJob)
      .to receive(:perform_later)
  end

  it "pending状態の計算履歴を作成してジョブを登録する" do
    calculation_run =
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )

    expect(calculation_run).to be_persisted
    expect(calculation_run.status).to eq("pending")
    expect(calculation_run.base_date).to eq(base_date)
    expect(calculation_run.rf_rule_set).to eq(rule_set)
    expect(calculation_run.started_by_staff).to eq(staff)

    expect(calculation_run.aggregation_started_on)
      .to eq(Date.new(2024, 10, 3))

    expect(calculation_run.frequency_started_on)
      .to eq(Date.new(2025, 10, 3))

    expect(RfCalculationRunJob)
      .to have_received(:perform_later)
      .with(calculation_run.id)
      .once
  end

  it "現在適用中の計算履歴をprevious_runに設定する" do
    previous_run =
      RfCalculationRun.create!(
        rf_rule_set: rule_set,
        base_date: Date.new(2026, 9, 30),
        aggregation_started_on: Date.new(2024, 9, 30),
        frequency_started_on: Date.new(2025, 9, 30),
        status: "completed",
        completed_at: Time.current
      )

    RfSetting.create!(
      current_calculation_run: previous_run
    )

    calculation_run =
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )

    expect(calculation_run.previous_run)
      .to eq(previous_run)
  end

  it "公開前のRFルールでは履歴とジョブを作成しない" do
    rule_set.update!(status: "draft")

    expect do
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )
    end.to raise_error(
      Rf::CalculationRunStarter::InvalidRuleSetError,
      "公開済みのRFルールを指定してください"
    )

    expect(RfCalculationRun.count).to eq(0)

    expect(RfCalculationRunJob)
      .not_to have_received(:perform_later)
  end
end
