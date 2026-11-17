require "rails_helper"

RSpec.describe Rf::RunPopulationRowBuilder do
  let(:rank_master) do
    create(:standard_master, system_key: "rf_rank")
  end

  let(:rank_a) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      label: "Aランク",
      display_color: "#059669",
      position: 1
    )
  end

  let(:no_visit_rank) do
    create(
      :standard_list_master,
      standard_master: rank_master,
      label: "来店履歴なし",
      display_color: "#94A3B8",
      position: 2
    )
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "履歴表示用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      no_visit_rank: no_visit_rank
    )
  end

  let(:run) do
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 10, 1),
      aggregation_started_on: Date.new(2021, 10, 1),
      frequency_started_on: Date.new(2025, 10, 1),
      status: "completed",
      rf_rank_snapshots: [
        snapshot_for(rank_a),
        snapshot_for(no_visit_rank)
      ]
    )
  end

  def snapshot_for(rank)
    {
      "id" => rank.id,
      "display_code" => rank.display_code,
      "label" => rank.label,
      "display_color" => rank.display_color,
      "position" => rank.position
    }
  end

  def create_ranked_result
    run.customer_rf_rank_results.create!(
      customer: create(:customer),
      rf_rank: rank_a,
      recency_days: 30,
      frequency_count: 2
    )
  end

  it "マスター変更後も計算当時の名前、色、表示順を使う" do
    create_ranked_result

    rank_a.update!(
      label: "変更後のランク",
      display_color: "#FF0000",
      position: 10
    )

    result = described_class.call(calculation_run: run.reload)

    expect(result.fetch(:ranks)).to eq(
      [
        {
          id: rank_a.id,
          display_code: rank_a.display_code,
          label: "Aランク",
          display_color: "#059669",
          position: 1,
          count: 1
        },
        {
          id: no_visit_rank.id,
          display_code: no_visit_rank.display_code,
          label: "来店履歴なし",
          display_color: "#94A3B8",
          position: 2,
          count: 0
        }
      ]
    )

    expect(result.fetch(:total_count)).to eq(1)
  end

  it "スナップショットがない古い履歴は現在のマスターで補完する" do
    create_ranked_result
    run.update!(rf_rank_snapshots: nil)

    result = described_class.call(calculation_run: run.reload)

    expect(
      result.fetch(:ranks).map do |rank|
        [ rank.fetch(:id), rank.fetch(:count) ]
      end
    ).to eq(
      [
        [ rank_a.id, 1 ],
        [ no_visit_rank.id, 0 ]
      ]
    )
  end

  it "結果のランクがスナップショットに欠けていればエラーにする" do
    create_ranked_result
    run.update!(
      rf_rank_snapshots: [ snapshot_for(no_visit_rank) ]
    )

    expect do
      described_class.call(calculation_run: run.reload)
    end.to raise_error(KeyError, /計算履歴にRFランクID/)
  end
end
