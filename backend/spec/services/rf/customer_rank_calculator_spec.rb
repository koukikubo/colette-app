require "rails_helper"

RSpec.describe Rf::CustomerRankCalculator do
  let(:base_date) do
    Date.new(2026, 9, 21)
  end

  let(:customer) do
    create(:customer)
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "テストRFルール",
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

  let!(:rank_a) do
    create_rank("A", "Aランク", 1)
  end

  let!(:rank_b) do
    create_rank("B", "Bランク", 2)
  end

  let!(:rank_c) do
    create_rank("C", "Cランク", 3)
  end

  let!(:rank_d) do
    create_rank("D", "Dランク", 4)
  end

  let!(:rank_n) do
    create_rank("N", "未分類", 5)
  end

  let!(:recent_rule) do
    rule_set.recency_rules.create!(
      code: "R1",
      label: "90日以内",
      min_days: 0,
      max_days: 90,
      position: 1
    )
  end

  let!(:old_rule) do
    rule_set.recency_rules.create!(
      code: "R2",
      label: "91日以上",
      min_days: 91,
      max_days: nil,
      position: 2
    )
  end

  let!(:low_frequency_rule) do
    rule_set.frequency_rules.create!(
      code: "F1",
      label: "1回以下",
      min_visits: 0,
      max_visits: 1,
      position: 1
    )
  end

  let!(:high_frequency_rule) do
    rule_set.frequency_rules.create!(
      code: "F2",
      label: "2回以上",
      min_visits: 2,
      max_visits: nil,
      position: 2
    )
  end

  let(:reservation_status) do
    master = create(
      :standard_master,
      system_key: "reservation_status",
      name: "予約状態"
    )

    create(
      :standard_list_master,
      standard_master: master,
      code: "confirmed",
      label: "予約確定"
    )
  end

  let(:restaurant_master_type) do
    master = create(
      :standard_master,
      system_key: "restaurant_master_type",
      name: "予約席種"
    )

    create(
      :standard_list_master,
      standard_master: master,
      code: "T",
      label: "テーブル席"
    )
  end

  before do
    create_mapping(recent_rule, low_frequency_rule, rank_b)
    create_mapping(recent_rule, high_frequency_rule, rank_a)
    create_mapping(old_rule, low_frequency_rule, rank_d)
    create_mapping(old_rule, high_frequency_rule, rank_c)
  end

  it "完了した予約から来店日数と来店回数を計算する" do
    create_completed_visit(Date.new(2026, 9, 1))
    create_completed_visit(Date.new(2026, 8, 1))

    result =
      described_class.call(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date
      )

    expect(result.rf_rank).to eq(rank_a)
    expect(result.recency_days).to eq(20)
    expect(result.frequency_count).to eq(2)
    expect(result.last_visit_on).to eq(Date.new(2026, 9, 1))
  end

  it "未完了の予約は来店回数に含めない" do
    create_completed_visit(Date.new(2026, 9, 1))
    create_uncompleted_reservation(Date.new(2026, 9, 10))

    result =
      described_class.call(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date
      )

    expect(result.rf_rank).to eq(rank_b)
    expect(result.frequency_count).to eq(1)
    expect(result.last_visit_on).to eq(Date.new(2026, 9, 1))
  end

  it "完了した予約がない顧客は未分類にする" do
    result =
      described_class.call(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date
      )

    expect(result.rf_rank).to eq(rank_n)
    expect(result.recency_days).to be_nil
    expect(result.frequency_count).to eq(0)
    expect(result.last_visit_on).to be_nil
  end

  private

  def create_rank(code, label, position)
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: code,
      label: label,
      position: position
    )
  end

  def create_mapping(recency_rule, frequency_rule, rank)
    rule_set.rank_mappings.create!(
      rf_recency_rule: recency_rule,
      rf_frequency_rule: frequency_rule,
      rf_rank: rank
    )
  end

  def create_completed_visit(date)
    create_reservation(
      date: date,
      completed_at: Time.zone.local(
        date.year,
        date.month,
        date.day,
        20
      )
    )
  end

  def create_uncompleted_reservation(date)
    create_reservation(
      date: date,
      completed_at: nil
    )
  end

  def create_reservation(date:, completed_at:)
    starts_at =
      Time.zone.local(
        date.year,
        date.month,
        date.day,
        18
      )

    create(
      :reservation,
      customer: customer,
      starts_at: starts_at,
      ends_at: starts_at + 2.hours,
      completed_at: completed_at,
      reservation_status: reservation_status,
      requested_restaurant_master_type: restaurant_master_type
    )
  end
end
