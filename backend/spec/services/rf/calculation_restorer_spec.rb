require "rails_helper"

RSpec.describe Rf::CalculationRestorer do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  it "選択した過去の計算履歴へ復元する" do
    oldest_run = create_run

    middle_run =
      create_run(
        previous_run: oldest_run
      )

    current_run =
      create_run(
        previous_run: middle_run
      )

    setting =
      RfSetting.create!(
        current_calculation_run: current_run
      )

    described_class.call(
      target_run: oldest_run,
      expected_current_run_id: current_run.id
    )

    expect(
      setting.reload.current_calculation_run
    ).to eq(oldest_run)
  end

  it "現在値が操作開始時から変わっている場合は復元しない" do
    previous_run = create_run

    current_run =
      create_run(
        previous_run: previous_run
      )

    setting =
      RfSetting.create!(
        current_calculation_run: current_run
      )

    expect do
      described_class.call(
        target_run: previous_run,
        expected_current_run_id: previous_run.id
      )
    end.to raise_error(
      Rf::CalculationRestorer::StaleRunError
    )

    expect(
      setting.reload.current_calculation_run
    ).to eq(current_run)
  end

  it "現在の履歴とつながっていない履歴には復元しない" do
    previous_run = create_run

    current_run =
      create_run(
        previous_run: previous_run
      )

    unrelated_run = create_run

    setting =
      RfSetting.create!(
        current_calculation_run: current_run
      )

    expect do
      described_class.call(
        target_run: unrelated_run,
        expected_current_run_id: current_run.id
      )
    end.to raise_error(
      Rf::CalculationRestorer::NotAncestorError
    )

    expect(
      setting.reload.current_calculation_run
    ).to eq(current_run)
  end

  it "計算が完了していない履歴には復元しない" do
    processing_run =
      create_run(
        status: "processing"
      )

    current_run =
      create_run(
        previous_run: processing_run
      )

    setting =
      RfSetting.create!(
        current_calculation_run: current_run
      )

    expect do
      described_class.call(
        target_run: processing_run,
        expected_current_run_id: current_run.id
      )
    end.to raise_error(
      Rf::CalculationRestorer::IncompleteRunError
    )

    expect(
      setting.reload.current_calculation_run
    ).to eq(current_run)
  end

  private

  def create_run(previous_run: nil, status: "completed")
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: Date.new(2026, 9, 23),
      aggregation_started_on: Date.new(2021, 9, 23),
      frequency_started_on: Date.new(2025, 9, 23),
      status: status,
      completed_at:
        status == "completed" ? Time.current : nil
    )
  end
end
