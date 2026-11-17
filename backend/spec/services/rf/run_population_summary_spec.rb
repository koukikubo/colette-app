require "rails_helper"

RSpec.describe Rf::RunPopulationSummary do
  let(:rank_master) do
    create(:standard_master, system_key: "rf_rank")
  end

  let(:rank_a) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      label: "Aランク"
    )
  end

  let(:no_visit_rank) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      label: "来店履歴なし"
    )
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "人数集計用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  let(:run) do
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 10, 1),
      aggregation_started_on: Date.new(2021, 10, 1),
      frequency_started_on: Date.new(2025, 10, 1),
      status: "completed"
    )
  end

  def create_result(**attributes)
    run.customer_rf_rank_results.create!(
      {
        customer: create(:customer),
        frequency_count: 0
      }.merge(attributes)
    )
  end

  it "ランク別人数、未分類、対象外を分けて集計する" do
    2.times do
      create_result(
        rf_rank: rank_a,
        recency_days: 30,
        frequency_count: 2
      )
    end

    create_result(
      rf_rank: no_visit_rank,
      recency_days: nil
    )

    create_result(
      exclusion_reason: "no_matching_rule",
      recency_days: 30
    )

    create_result(
      exclusion_reason: "manual_customer_rank"
    )

    expect(
      described_class.call(calculation_run: run)
    ).to eq(
      {
        rank_counts: {
          rank_a.id => 2,
          no_visit_rank.id => 1
        },
        ranked_count: 3,
        unmatched_count: 1,
        excluded_count: 1,
        eligible_count: 4,
        total_count: 5
      }
    )
  end

  it "計算結果がなければ人数をすべて0で返す" do
    expect(
      described_class.call(calculation_run: run)
    ).to eq(
      {
        rank_counts: {},
        ranked_count: 0,
        unmatched_count: 0,
        excluded_count: 0,
        eligible_count: 0,
        total_count: 0
      }
    )
  end

  it "計算が完了していなければエラーにする" do
    run.update!(status: "processing")

    expect do
      described_class.call(calculation_run: run)
    end.to raise_error(
      described_class::IncompleteRunError
    )
  end
end
