require "rails_helper"

RSpec.describe Rf::CustomerMovementSummary do
  let(:rank_master) do
    create(:standard_master, system_key: "rf_rank")
  end

  let(:rank_a) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      position: 1
    )
  end

  let(:rank_b) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      position: 2
    )
  end

  let(:no_visit_rank) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      position: 3
    )
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "移動集計用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      no_visit_rank: no_visit_rank
    )
  end

  let(:previous_run) do
    create_run(base_date: Date.new(2026, 9, 1))
  end

  let(:current_run) do
    create_run(
      base_date: Date.new(2026, 10, 1),
      previous_run: previous_run
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
      rf_rank_snapshots: [
        rank_a,
        rank_b,
        no_visit_rank
      ].map do |rank|
        {
          "id" => rank.id,
          "display_code" => rank.display_code,
          "label" => rank.label,
          "display_color" => rank.display_color,
          "position" => rank.position
        }
      end
    )
  end

  def add_result(run, customer, rank: nil, reason: nil)
    run.customer_rf_rank_results.create!(
      customer: customer,
      rf_rank: rank,
      exclusion_reason: reason,
      frequency_count: 0
    )
  end

  def add_pair(previous_rank:, current_rank:)
    customer = create(:customer)

    add_result(previous_run, customer, rank: previous_rank)
    add_result(current_run, customer, rank: current_rank)
  end

  it "通常ランクの上昇、下降、維持を集計する" do
    add_pair(previous_rank: rank_b, current_rank: rank_a)
    add_pair(previous_rank: rank_a, current_rank: rank_b)
    add_pair(previous_rank: rank_a, current_rank: rank_a)

    result = described_class.call(calculation_run: current_run)
    counts = result.fetch(:counts)

    expect(result.fetch(:comparison_run_id)).to eq(previous_run.id)
    expect(counts.fetch(:up)).to eq(1)
    expect(counts.fetch(:down)).to eq(1)
    expect(counts.fetch(:unchanged)).to eq(1)
    expect(counts.values.sum).to eq(3)
  end

  it "来店履歴なし、未分類、対象外を通常の移動と分ける" do
    add_pair(
      previous_rank: no_visit_rank,
      current_rank: rank_a
    )

    unmatched_customer = create(:customer)
    add_result(previous_run, unmatched_customer, rank: rank_a)
    add_result(
      current_run,
      unmatched_customer,
      reason: "no_matching_rule"
    )

    excluded_customer = create(:customer)
    add_result(previous_run, excluded_customer, rank: rank_a)
    add_result(
      current_run,
      excluded_customer,
      reason: "manual_customer_rank"
    )

    counts =
      described_class
        .call(calculation_run: current_run)
        .fetch(:counts)

    expect(counts.fetch(:no_visit)).to eq(1)
    expect(counts.fetch(:unmatched)).to eq(1)
    expect(counts.fetch(:excluded)).to eq(1)
    expect(counts.fetch(:up)).to eq(0)
    expect(counts.fetch(:down)).to eq(0)
    expect(counts.values.sum).to eq(3)
  end

  it "今回だけ、前回だけ存在する顧客を分ける" do
    add_result(current_run, create(:customer), rank: rank_a)
    add_result(previous_run, create(:customer), rank: rank_b)

    counts =
      described_class
        .call(calculation_run: current_run)
        .fetch(:counts)

    expect(counts.fetch(:added)).to eq(1)
    expect(counts.fetch(:removed)).to eq(1)
    expect(counts.values.sum).to eq(2)
  end

  it "初回の計算では比較対象なしを返す" do
    expect(
      described_class.call(calculation_run: previous_run)
    ).to eq(
      {
        comparison_run_id: nil,
        counts: nil,
        transitions: []
      }
    )
  end

  it "同じ方向の移動をまとめ、逆方向の移動とは分ける" do
  2.times do
    add_pair(
      previous_rank: no_visit_rank,
      current_rank: rank_a
    )
  end

  add_pair(
    previous_rank: rank_a,
    current_rank: no_visit_rank
  )

  transitions =
    described_class
      .call(calculation_run: current_run)
      .fetch(:transitions)

  expect(
    transitions.map do |transition|
      [
        transition.fetch(:category),
        transition.fetch(:from_state),
        transition.fetch(:from_rank).fetch(:id),
        transition.fetch(:to_state),
        transition.fetch(:to_rank).fetch(:id),
        transition.fetch(:count)
      ]
    end
  ).to match_array(
    [
      [
        :no_visit,
        :no_visit,
        no_visit_rank.id,
        :ranked,
        rank_a.id,
        2
      ],
      [
        :no_visit,
        :ranked,
        rank_a.id,
        :no_visit,
        no_visit_rank.id,
        1
      ]
    ]
  )
end

  it "今回だけの顧客と対象外への移動を内訳でも区別する" do
    add_result(current_run, create(:customer), rank: rank_a)

    customer = create(:customer)
    add_result(previous_run, customer, rank: rank_a)
    add_result(
      current_run,
      customer,
      reason: "manual_customer_rank"
    )

    transitions =
      described_class
        .call(calculation_run: current_run)
        .fetch(:transitions)

    added = transitions.find do |transition|
      transition.fetch(:category) == :added
    end

    excluded = transitions.find do |transition|
      transition.fetch(:category) == :excluded
    end

    expect(added.fetch(:from_state)).to eq(:missing)
    expect(added.fetch(:from_rank)).to be_nil
    expect(added.fetch(:to_state)).to eq(:ranked)
    expect(added.fetch(:to_rank).fetch(:id)).to eq(rank_a.id)

    expect(excluded.fetch(:from_state)).to eq(:ranked)
    expect(excluded.fetch(:from_rank).fetch(:id)).to eq(rank_a.id)
    expect(excluded.fetch(:to_state)).to eq(:excluded)
    expect(excluded.fetch(:to_rank)).to be_nil
  end
end
