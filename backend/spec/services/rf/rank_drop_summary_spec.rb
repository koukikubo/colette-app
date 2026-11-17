require "rails_helper"

RSpec.describe Rf::RankDropSummary do
  include_context "RF rank drop history"

  # 通常は適用中の履歴を渡し、必要なテストだけ期間やページを変更する。
  def summarize(current: current_run, **parameters)
    described_class.call(current_run: current, **parameters)
  end

  it "通常ランクの低下だけを抽出する" do
    dropped = customer_with_change(from: rank_a, to: rank_c)
    customer_with_change(from: rank_c, to: rank_a)
    customer_with_change(from: rank_b, to: rank_b)

    result = summarize

    expect(result[:state]).to eq(:ready)
    expect(result.dig(:pagination, :total_count)).to eq(1)
    expect(result[:customers].map { |row| row[:customer_id] }).to eq([ dropped.id ])
  end

  it "期間初日の判定に期間外の前回履歴を使用できる" do
    customer_with_change(from: rank_a, to: rank_b)

    result = summarize(
      start_date: "2026-11-01",
      end_date: "2026-11-01"
    )

    expect(result.dig(:pagination, :total_count)).to eq(1)
    expect(result[:customers].first[:comparison_run_id]).to eq(previous_run.id)
  end

  it "翌日の計算で維持になっても期間内の低下として残す" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    next_run = history_on("2026-11-02", previous: current_run)
    add_history_result(next_run, customer, rank: rank_c)

    row = summarize(current: next_run)[:customers].first

    expect(row[:detected_on]).to eq(Date.new(2026, 11, 1))
    expect(row[:calculation_run_id]).to eq(current_run.id)
    expect(row.dig(:latest_rank, :id)).to eq(rank_c.id)
  end

  it "回復した顧客も残し、低下時と現在のランクを区別する" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    recovered_run = history_on("2026-11-02", previous: current_run)
    add_history_result(recovered_run, customer, rank: rank_a)

    row = summarize(current: recovered_run)[:customers].first

    expect(row.dig(:previous_rank, :id)).to eq(rank_a.id)
    expect(row.dig(:dropped_rank, :id)).to eq(rank_c.id)
    expect(row.dig(:latest_rank, :id)).to eq(rank_a.id)
  end

  it "同じ顧客が複数回低下した場合は期間内の最新の低下を1件返す" do
    customer = customer_with_change(from: rank_a, to: rank_b)
    recovered_run = history_on("2026-11-02", previous: current_run)
    latest_run = history_on("2026-11-03", previous: recovered_run)
    add_history_result(recovered_run, customer, rank: rank_a)
    add_history_result(latest_run, customer, rank: rank_c)

    result = summarize(current: latest_run)

    expect(result.dig(:pagination, :total_count)).to eq(1)
    expect(result[:customers].first).to include(
      detected_on: Date.new(2026, 11, 3),
      calculation_run_id: latest_run.id,
      comparison_run_id: recovered_run.id
    )
  end

  it "期間外の低下は対象に含めない" do
    customer = customer_with_change(from: rank_a, to: rank_b)
    next_run = history_on("2026-11-02", previous: current_run)
    add_history_result(next_run, customer, rank: rank_b)

    result = summarize(
      current: next_run,
      start_date: "2026-11-02",
      end_date: "2026-11-02"
    )

    expect(result[:state]).to eq(:ready)
    expect(result.dig(:pagination, :total_count)).to eq(0)
  end

  it "計算対象外・未分類・来店履歴なしを含む移動を除外する" do
    customer_with_change(from: rank_a, to: no_visit_rank)
    customer_with_change(from: no_visit_rank, to: rank_c)

    %w[manual_customer_rank no_matching_rule].each do |reason|
      before_customer = history_customer
      add_history_result(previous_run, before_customer, reason: reason)
      add_history_result(current_run, before_customer, rank: rank_c)

      after_customer = history_customer
      add_history_result(previous_run, after_customer, rank: rank_a)
      add_history_result(current_run, after_customer, reason: reason)
    end

    expect(summarize.dig(:pagination, :total_count)).to eq(0)
  end

  it "片方にしか記録がない顧客を低下と判定しない" do
    added_customer = history_customer
    removed_customer = history_customer
    add_history_result(current_run, added_customer, rank: rank_c)
    add_history_result(previous_run, removed_customer, rank: rank_a)

    expect(summarize.dig(:pagination, :total_count)).to eq(0)
  end

  it "現在非表示の顧客を人数と一覧の両方から除外する" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    customer.update!(hidden_at: Time.current)

    result = summarize

    expect(result.dig(:pagination, :total_count)).to eq(0)
    expect(result[:customers]).to be_empty
  end

  it "低下後に対象外になった場合も、低下記録と現在の状態を区別する" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    next_run = history_on("2026-11-02", previous: current_run)
    add_history_result(next_run, customer, reason: "manual_customer_rank")

    row = summarize(current: next_run)[:customers].first

    expect(row.dig(:dropped_rank, :id)).to eq(rank_c.id)
    expect(row[:latest_state]).to eq(:excluded)
    expect(row[:latest_rank]).to be_nil
  end

  it "現在適用中の履歴につながらない計算結果を含めない" do
    customer_with_change(from: rank_a, to: rank_a)
    unapplied_run = history_on("2026-11-10", previous: current_run)
    customer = history_customer
    add_history_result(current_run, customer, rank: rank_a)
    add_history_result(unapplied_run, customer, rank: rank_c)

    expect(summarize.dig(:pagination, :total_count)).to eq(0)
  end

  it "ランクマスタを変更しても履歴に保存された名前と順位を使う" do
    customer_with_change(from: rank_a, to: rank_c)
    original_label = rank_a.label
    rank_a.update!(label: "変更後の名称", position: 100)

    row = summarize[:customers].first

    expect(row.dig(:previous_rank, :label)).to eq(original_label)
    expect(row.dig(:previous_rank, :position)).to eq(1)
  end

  it "最終来店日には適用中の計算結果の値を使う" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    next_run = history_on("2026-11-02", previous: current_run)
    add_history_result(
      next_run,
      customer,
      rank: rank_c,
      last_visit_on: Date.new(2026, 11, 2)
    )

    row = summarize(current: next_run)[:customers].first

    expect(row[:last_visit_on]).to eq(Date.new(2026, 11, 2))
  end

  it "法人顧客は法人名を表示する" do
    customer = history_customer(
      customer_kind: "corporate",
      company_name: "株式会社テスト"
    )
    add_history_result(previous_run, customer, rank: rank_a)
    add_history_result(current_run, customer, rank: rank_c)

    expect(summarize[:customers].first[:customer_name]).to eq("株式会社テスト")
  end

  it "当月初日から今日までを初期期間にする" do
    result = summarize(current: nil)

    expect(result[:start_date]).to eq(Date.new(2026, 11, 1))
    expect(result[:end_date]).to eq(Date.new(2026, 11, 15))
  end

  it "適用履歴なしと対象者0人を区別する" do
    result = summarize(current: nil)

    expect(result[:state]).to eq(:no_current_run)
    expect(result.dig(:pagination, :total_count)).to be_nil
  end

  it "期間内に履歴がない場合を返す" do
    result = summarize(current: previous_run)

    expect(result[:state]).to eq(:no_history_in_period)
    expect(result.dig(:pagination, :total_count)).to be_nil
  end

  it "前回履歴がない場合を返す" do
    first_run = history_on("2026-11-01")

    result = summarize(current: first_run)

    expect(result[:state]).to eq(:no_previous_run)
    expect(result[:skipped_comparisons].first[:reason]).to eq(:no_previous_run)
  end

  it "ルール変更で比較できないことを返す" do
    other_rules = RfRuleSet.create!(
      name: "変更後ルール",
      version: 2,
      aggregation_months: 60,
      frequency_window_months: 12
    )
    changed_run = history_on(
      "2026-11-01",
      previous: previous_run,
      rules: other_rules
    )

    result = summarize(current: changed_run)

    expect(result[:state]).to eq(:no_comparable_history)
    expect(result[:skipped_comparisons].first[:reason]).to eq(:rule_set_changed)
  end

  it "一部にルール変更があっても比較可能な履歴の結果と省略理由を返す" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    other_rules = RfRuleSet.create!(
      name: "変更後ルール",
      version: 2,
      aggregation_months: 60,
      frequency_window_months: 12
    )
    changed_run = history_on(
      "2026-11-02",
      previous: current_run,
      rules: other_rules
    )
    add_history_result(changed_run, customer, rank: rank_b)

    result = summarize(current: changed_run)

    expect(result[:state]).to eq(:ready)
    expect(result.dig(:pagination, :total_count)).to eq(1)
    expect(result[:skipped_comparisons].first[:reason]).to eq(:rule_set_changed)
  end

  it "日付が逆転した比較を省略する" do
    later_run = history_on("2026-11-02")
    reversed_run = history_on("2026-11-01", previous: later_run)

    result = summarize(current: reversed_run)

    expect(result[:state]).to eq(:no_comparable_history)
    expect(result[:skipped_comparisons].first[:reason]).to eq(:base_date_reversed)
  end

  it "未完了の計算結果をエラーにする" do
    failed_run = history_on("2026-11-01", status: "failed")

    expect { summarize(current: failed_run) }
      .to raise_error(Rf::RunPopulationSummary::IncompleteRunError)
  end

  it "顧客・設定・履歴・計算結果を変更しない" do
    customer = customer_with_change(from: rank_a, to: rank_c)
    setting = RfSetting.create!(current_calculation_run: current_run)

    expect { summarize }.not_to change {
      [
        customer.reload.attributes,
        setting.reload.attributes,
        RfCalculationRun.count,
        CustomerRfRankResult.count
      ]
    }
  end

  context "ページネーション" do
    it "20件ずつ取得し、全対象へ重複なく到達できる" do
      customers = Array.new(23) do
        customer_with_change(from: rank_a, to: rank_c)
      end

      first = summarize(page: "1", per_page: "20")
      second = summarize(page: "2", per_page: "20")
      first_ids = first[:customers].map { |row| row[:customer_id] }
      second_ids = second[:customers].map { |row| row[:customer_id] }

      expect(first[:pagination]).to include(
        current_page: 1,
        per_page: 20,
        total_count: 23,
        total_pages: 2
      )
      expect(second[:pagination]).to include(
        current_page: 2,
        total_count: 23,
        total_pages: 2
      )
      expect(first_ids.size).to eq(20)
      expect(second_ids.size).to eq(3)
      expect(first_ids & second_ids).to be_empty
      expect(first_ids + second_ids).to eq(customers.map(&:id).sort)
    end

    [ 20, 50, 100 ].each do |size|
      it "#{size}件表示を受け付ける" do
        result = summarize(per_page: size.to_s)

        expect(result.dig(:pagination, :per_page)).to eq(size)
      end
    end

    it "末尾より後のページは総件数を保ったまま空配列を返す" do
      customer_with_change(from: rank_a, to: rank_c)

      result = summarize(page: 2)

      expect(result.dig(:pagination, :total_count)).to eq(1)
      expect(result[:customers]).to be_empty
    end

    [ "0", "-1", "abc", "1.5" ].each do |value|
      it "不正なページ番号#{value.inspect}を拒否する" do
        expect { summarize(page: value) }
          .to raise_error(described_class::InvalidParameterError)
      end
    end

    [ "0", "21", "101", "abc" ].each do |value|
      it "選択肢にない表示件数#{value.inspect}を拒否する" do
        expect { summarize(per_page: value) }
          .to raise_error(described_class::InvalidParameterError)
      end
    end

    it "履歴上で同順位の別ランクへの変更を低下に含めない" do
    customer_with_change(from: rank_b, to: same_position_rank)

    # 前回履歴のrank_bは順位2。
    # 今回履歴では2つの順位を入れ替え、別ランクへの同順位移動を再現する。
    # 現在のマスタは変更せず、履歴のスナップショットを比較することも確認する。
    snapshots = current_run.rf_rank_snapshots.map do |rank|
    case rank.fetch("id")
    when same_position_rank.id
      rank.merge("position" => rank_b.position)
    when rank_b.id
      rank.merge("position" => same_position_rank.position)
    else
      rank
    end
  end

    current_run.update!(rf_rank_snapshots: snapshots)

    result = summarize

    expect(result[:state]).to eq(:ready)
    expect(result.dig(:pagination, :total_count)).to eq(0)
    expect(result[:customers]).to be_empty
  end
  end

  context "期間の検証" do
    [
      { start_date: "2026/11/01" },
      { start_date: "2026-02-30" },
      { start_date: "2026-11-10", end_date: "2026-11-01" },
      { end_date: "2026-11-16" }
    ].each do |parameters|
      it "#{parameters.inspect}を拒否する" do
        expect { summarize(**parameters) }
          .to raise_error(described_class::InvalidParameterError)
      end
    end
  end
end
