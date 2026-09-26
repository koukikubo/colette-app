require "rails_helper"

RSpec.describe Rf::CalculationPreviewBuilder do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  let(:rf_rank_master) do
    create(
      :standard_master,
      system_key: "rf_rank",
      name: "RFランク"
    )
  end

  let(:rank_a) do
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "A",
      label: "Aランク",
      position: 1
    )
  end

  let(:rank_b) do
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "B",
      label: "Bランク",
      position: 2
    )
  end

  it "変更・変更なし・対象外とランク遷移を集計する" do
    changed_customer = create(:customer)
    unchanged_customer = create(:customer)
    excluded_customer = create(:customer)

    previous_run = create_run

    create_result(
      previous_run,
      customer: changed_customer,
      rf_rank: rank_b
    )

    create_result(
      previous_run,
      customer: unchanged_customer,
      rf_rank: rank_a
    )

    current_run = create_run(previous_run: previous_run)

    create_result(
      current_run,
      customer: changed_customer,
      rf_rank: rank_a
    )

    create_result(
      current_run,
      customer: unchanged_customer,
      rf_rank: rank_a
    )

    current_run.customer_rf_rank_results.create!(
      customer: excluded_customer,
      exclusion_reason: "manual_customer_rank",
      frequency_count: 0
    )

    preview =
      described_class.call(
        calculation_run: current_run
      )

    expect(preview.changed_count).to eq(1)
    expect(preview.unchanged_count).to eq(1)
    expect(preview.excluded_count).to eq(1)

    expect(preview.rank_transitions.length).to eq(1)

    transition = preview.rank_transitions.first

    expect(transition.from_rf_rank).to eq(rank_b)
    expect(transition.to_rf_rank).to eq(rank_a)
    expect(transition.count).to eq(1)
  end

  private

  def create_run(previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: Date.new(2026, 9, 23),
      aggregation_started_on: Date.new(2021, 9, 23),
      frequency_started_on: Date.new(2025, 9, 23),
      status: "completed",
      completed_at: Time.current
    )
  end

  def create_result(calculation_run, customer:, rf_rank:)
    calculation_run.customer_rf_rank_results.create!(
      customer: customer,
      rf_rank: rf_rank,
      recency_days: 20,
      frequency_count: 2,
      last_visit_on: Date.new(2026, 9, 3)
    )
  end
end
