# RFランク低下のサービス・APIテストで使用する履歴作成処理。
# 実際のDBレコードを作り、比較処理自体はモックに置き換えない。
RSpec.shared_context "RF rank drop history" do
  include ActiveSupport::Testing::TimeHelpers

  # 実行日に左右されず、当月初期値や未来日の検証を行う。
  around do |example|
    travel_to(Time.zone.local(2026, 11, 15, 12)) do
      example.run
    end
  end

  let(:rank_master) do
    create(:standard_master, system_key: "rf_rank")
  end

  let(:rank_a) do
    create(:standard_list_master, standard_master: rank_master, position: 1)
  end

  let(:rank_b) do
    create(:standard_list_master, standard_master: rank_master, position: 2)
  end

  let(:rank_c) do
    create(:standard_list_master, standard_master: rank_master, position: 3)
  end

  let(:same_position_rank) do
    create(:standard_list_master, standard_master: rank_master, position: 4)
  end

  let(:no_visit_rank) do
    create(:standard_list_master, standard_master: rank_master, position: 99)
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "ランク低下テスト用",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      no_visit_rank: no_visit_rank
    )
  end

  let(:customer_staff) { create(:staff) }

  let(:previous_run) { history_on("2026-10-31") }

  let(:current_run) do
    history_on("2026-11-01", previous: previous_run)
  end

  # 指定日の計算履歴を作る。
  # ランク情報も保存し、現在のマスタとは独立した履歴を再現する。
  def history_on(date, previous: nil, rules: rule_set, status: "completed")
    base_date = Date.iso8601(date)

    RfCalculationRun.create!(
      rf_rule_set: rules,
      previous_run: previous,
      status: status,
      base_date: base_date,
      aggregation_started_on: base_date - 60.months,
      frequency_started_on: base_date - 12.months,
      rf_rank_snapshots: [
        rank_a, rank_b, rank_c, same_position_rank, no_visit_rank
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

  # 共通の登録担当者を使い、顧客を作る。
  # 件数の多いページネーションテストで、不要な担当者作成を減らす。
  def history_customer(**attributes)
    create(
      :customer,
      created_by_staff: customer_staff,
      updated_by_staff: customer_staff,
      **attributes
    )
  end

  # 1人分の計算結果を履歴へ追加する。
  # rank:nilとreasonを使うことで、対象外・未分類も再現できる。
  def add_history_result(
    run,
    customer,
    rank: nil,
    reason: nil,
    last_visit_on: Date.new(2026, 10, 1)
  )
    run.customer_rf_rank_results.create!(
      customer: customer,
      rf_rank: rank,
      exclusion_reason: reason,
      frequency_count: 1,
      last_visit_on: last_visit_on
    )
  end

  # 前回・今回の2つの結果を持つ顧客を作る。
  # 戻り値の顧客を使って、対象IDや非表示化などを検証する。
  def customer_with_change(from:, to:)
    customer = history_customer
    add_history_result(previous_run, customer, rank: from)
    add_history_result(current_run, customer, rank: to)
    customer
  end
end
