require "rails_helper"

RSpec.describe Rf::CalculationAnalysisBuilder do
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
      position: 1,
      display_color: "#059669"
    )
  end

  let(:rank_n) do
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "N",
      label: "Nランク",
      position: 2,
      display_color: "#64748B"
    )
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "分析用RFルール",
      no_visit_rank: rank_n,
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  let!(:recency_rule) do
    rule_set.recency_rules.create!(
      code: "R1",
      label: "0〜90日",
      min_days: 0,
      max_days: 90,
      position: 1
    )
  end

  let!(:frequency_rule) do
    rule_set.frequency_rules.create!(
      code: "F1",
      label: "1回以上",
      min_visits: 1,
      max_visits: nil,
      position: 1
    )
  end

  before do
    rule_set.rank_mappings.create!(
      rf_recency_rule: recency_rule,
      rf_frequency_rule: frequency_rule,
      rf_rank: rank_a
    )
  end

  it "条件セルごとの人数と割合を集計する" do
    run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        customer_count: 5,
        excluded_count: 1,
        unmatched_count: 1
      )

    2.times do
      create_result(
        run,
        rf_rank: rank_a,
        recency_days: 30,
        frequency_count: 3
      )
    end

    create_result(
      run,
      rf_rank: rank_n,
      recency_days: nil,
      frequency_count: 0
    )

    create_unmatched_result(run)
    create_excluded_result(run)

    result =
      described_class.call(
        calculation_run: run
      )

    expect(result.eligible_count).to eq(4)
    expect(result.no_visit_count).to eq(1)
    expect(result.no_visit_percentage).to eq(25.0)
    expect(result.unmatched_percentage).to eq(25.0)

    cell = result.cells.first

    expect(cell.count).to eq(2)
    expect(cell.percentage).to eq(50.0)
    expect(cell.rf_rank).to eq(rank_a)

    distribution =
      result.rank_distribution.index_by do |item|
        item.rf_rank.id
      end

    expect(distribution.fetch(rank_a.id).count).to eq(2)
    expect(distribution.fetch(rank_a.id).percentage).to eq(50.0)

    expect(distribution.fetch(rank_n.id).count).to eq(1)
    expect(distribution.fetch(rank_n.id).percentage).to eq(25.0)

    cell_count = result.cells.sum(&:count)

    expect(
      result.cells.sum(&:count) +
        result.no_visit_count +
        run.unmatched_count
    ).to eq(result.eligible_count)

    percentage_total =
      result.cells.sum(&:percentage) +
      result.no_visit_percentage +
      result.unmatched_percentage

    expect(percentage_total)
      .to be_within(0.1).of(100.0)
  end

  it "1年前以前で最も新しい適用履歴と比較する" do
    old_run =
      create_run(
        base_date: Date.new(2025, 10, 1),
        customer_count: 2
      )

    create_result(
      old_run,
      rf_rank: rank_a,
      recency_days: 30,
      frequency_count: 2
    )

    older_run =
      create_run(
        base_date: Date.new(2025, 9, 1),
        previous_run: old_run,
        customer_count: 1
      )

    current_run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        previous_run: older_run,
        customer_count: 2
      )

    2.times do
      create_result(
        current_run,
        rf_rank: rank_a,
        recency_days: 30,
        frequency_count: 2
      )
    end

    result =
      described_class.call(
        calculation_run: current_run
      )

    expect(result.comparison_run).to eq(old_run)

    comparison = result.rank_comparisons.first

    expect(comparison.previous_count).to eq(1)
    expect(comparison.current_count).to eq(2)
    expect(comparison.count_delta).to eq(1)
  end

  it "1年前の比較履歴がない場合は比較を返さない" do
    run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        customer_count: 0
      )

    result =
      described_class.call(
        calculation_run: run
      )

    expect(result.comparison_run).to be_nil
    expect(result.rank_comparisons).to eq([])
  end

  it "未完了の計算結果は分析しない" do
    run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        status: "processing"
      )

    expect do
      described_class.call(
        calculation_run: run
      )
    end.to raise_error(
      described_class::IncompleteRunError
    )
  end

  it "前年同月の最新の適用履歴と比較する" do
    september_run =
      create_run(
        base_date: Date.new(2025, 9, 30)
      )

    october_run =
      create_run(
        base_date: Date.new(2025, 10, 31),
        previous_run: september_run
      )

    current_run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        previous_run: october_run
      )

    result =
      described_class.call(
        calculation_run: current_run
      )

    expect(result.comparison_run)
      .to eq(october_run)

    expect(result.comparison_run)
      .not_to eq(september_run)
  end

  it "計算後に無効化されたRFランクも分布へ残す" do
    run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        customer_count: 1
      )

    create_result(
      run,
      rf_rank: rank_a,
      recency_days: 30,
      frequency_count: 2
    )

    rank_a.update!(active: false)

    result =
      described_class.call(
        calculation_run: run
      )

    distribution =
      result.rank_distribution.find do |item|
        item.rf_rank.id == rank_a.id
      end

    expect(distribution).to be_present
    expect(distribution.count).to eq(1)
    expect(distribution.percentage).to eq(100.0)
  end

  it "顧客が0人でもIDで選んだコードなしランクを分布へ残す" do
    rank_n.update!(code: nil)
    active_no_visit_rank = rank_n

    run =
      create_run(
        base_date: Date.new(2026, 10, 10),
        customer_count: 0
      )

    result =
      described_class.call(
        calculation_run: run
      )

    distribution =
      result.rank_distribution.find do |item|
        item.rf_rank.id == active_no_visit_rank.id
      end

    expect(distribution).to be_present
    expect(distribution.count).to eq(0)
    expect(distribution.percentage).to eq(0.0)
  end

  it "マスタ変更後も保存したランク情報と並び順で分析する" do
    run = create_run(
      base_date: Date.new(2026, 10, 10),
      customer_count: 1
    )

    create_result(
      run,
      rf_rank: rank_a,
      recency_days: 30,
      frequency_count: 2
    )

    run.update!(
      rf_rank_snapshots: [ rank_a, rank_n ].map do |rank|
        rank.attributes.slice(
          "id",
          "code",
          "label",
          "display_color",
          "position"
        )
      end
    )

    rank_a.update!(
      label: "変更後のA",
      display_color: "#FF0000",
      position: 10
    )

    rank_n.update!(active: false)

    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: "X",
      label: "無関係なランク",
      position: 3,
      active: true
    )

    result = described_class.call(
      calculation_run: run.reload
    )

    expect(
      result.rank_distribution.map do |distribution|
        [
          distribution.rf_rank.display_code,
          distribution.rf_rank.label,
          distribution.rf_rank.display_color,
          distribution.count
        ]
      end
    ).to eq(
      [
        [ rank_a.display_code, "Aランク", "#059669", 1 ],
        [ rank_n.display_code, "Nランク", "#64748B", 0 ]
      ]
    )

    cell = result.cells.first

    expect(cell.rf_rank.label).to eq("Aランク")
    expect(cell.rf_rank.display_color).to eq("#059669")
    expect(cell.count).to eq(1)
  end

  it "前年比較に今回と前年の保存済みランク情報を使用する" do
  previous_run = create_run(
    base_date: Date.new(2025, 10, 10),
    customer_count: 1
  )

  create_result(
    previous_run,
    rf_rank: rank_n,
    recency_days: nil,
    frequency_count: 0
  )

  previous_run.update!(
    rf_rank_snapshots: [
      {
        "id" => rank_n.id,
        "code" => "N",
        "label" => "前年のNランク",
        "display_color" => "#123456",
        "position" => 2
      }
    ]
  )

  current_run = create_run(
    base_date: Date.new(2026, 10, 10),
    previous_run: previous_run,
    customer_count: 1
  )

  create_result(
    current_run,
    rf_rank: rank_a,
    recency_days: 30,
    frequency_count: 2
  )

  current_run.update!(
    rf_rank_snapshots: [ rank_a, rank_n ].map do |rank|
      rank.attributes.slice(
        "id",
        "code",
        "label",
        "display_color",
        "position"
      )
    end
  )

  rank_a.update!(
    label: "変更後のA",
    display_color: "#FF0000",
    position: 10
  )

  rank_n.update!(
    label: "変更後のN",
    display_color: "#FFFF00",
    active: false
  )

  result = described_class.call(
    calculation_run: current_run.reload
  )

  expect(result.comparison_run).to eq(previous_run)

  expect(
    result.rank_comparisons.map do |comparison|
      [
        comparison.rf_rank.display_code,
        comparison.rf_rank.label,
        comparison.rf_rank.display_color,
        comparison.current_count,
        comparison.previous_count,
        comparison.count_delta
      ]
    end
  ).to eq(
    [
      [ rank_a.display_code, "Aランク", "#059669", 1, 0, 1 ],
      [ rank_n.display_code, "前年のNランク", "#123456", 0, 1, -1 ]
    ]
  )
end

  private

  def create_run(
      base_date:,
      previous_run: nil,
      status: "completed",
      customer_count: 0,
      excluded_count: 0,
      unmatched_count: 0
    )
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: base_date,
      aggregation_started_on:
        base_date.advance(months: -60),
      frequency_started_on:
        base_date.advance(months: -12),
      status: status,
      customer_count: customer_count,
      excluded_count: excluded_count,
      unmatched_count: unmatched_count,
      completed_at:
        status == "completed" ? Time.current : nil
    )
  end

  def create_result(
      run,
      rf_rank:,
      recency_days:,
      frequency_count:
    )
    run.customer_rf_rank_results.create!(
      customer: create(:customer),
      rf_rank: rf_rank,
      recency_days: recency_days,
      frequency_count: frequency_count,
      last_visit_on:
        recency_days.nil? ? nil : run.base_date - recency_days.days
    )
  end

  def create_excluded_result(run)
    run.customer_rf_rank_results.create!(
      customer: create(:customer),
      exclusion_reason: "manual_customer_rank",
      frequency_count: 0
    )
  end

  def create_unmatched_result(run)
    run.customer_rf_rank_results.create!(
      customer: create(:customer),
      exclusion_reason: "no_matching_rule",
      recency_days: 30,
      frequency_count: 3,
      last_visit_on: run.base_date - 30.days
    )
  end
end
