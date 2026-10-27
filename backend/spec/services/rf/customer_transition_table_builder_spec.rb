require "rails_helper"

RSpec.describe Rf::CustomerTransitionTableBuilder do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "客層変動表用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  def create_run(base_date:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: base_date,
      aggregation_started_on: base_date - 60.months,
      frequency_started_on: base_date - 12.months,
      status: "completed",
      rf_rank_snapshots: []
    )
  end

  it "適用結果がなければ空の表を返す" do
    expect(
      described_class.call(current_run: nil)
    ).to eq(
      {
        current_calculation_run_id: nil,
        rows: []
      }
    )
  end

  it "履歴を計算基準日の新しい順に並べる" do
    first_run = create_run(
      base_date: Date.new(2026, 9, 1)
    )

    second_run = create_run(
      base_date: Date.new(2026, 10, 1),
      previous_run: first_run
    )

    current_run = create_run(
      base_date: Date.new(2026, 8, 1),
      previous_run: second_run
    )

    result = described_class.call(current_run: current_run)
    rows = result.fetch(:rows)

    expect(
      result.fetch(:current_calculation_run_id)
    ).to eq(current_run.id)

    expect(
      rows.map { |row| row.fetch(:calculation_run_id) }
    ).to eq(
      [ second_run.id, first_run.id, current_run.id ]
    )

    current_row = rows.find do |row|
      row.fetch(:calculation_run_id) == current_run.id
    end

    expect(
      current_row.fetch(:previous_run_id)
    ).to eq(second_run.id)
  end

  it "同じ計算基準日の履歴はIDの新しい順に並べる" do
    previous_run = create_run(
      base_date: Date.new(2026, 10, 1)
    )

    current_run = create_run(
      base_date: Date.new(2026, 10, 1),
      previous_run: previous_run
    )

    result = described_class.call(current_run: current_run)

    expect(
      result.fetch(:rows).map do |row|
        row.fetch(:calculation_run_id)
      end
    ).to eq(
      [ current_run.id, previous_run.id ]
    )
  end
end
