require "rails_helper"

RSpec.describe CustomerRfRankResult, type: :model do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "標準RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  let(:calculation_run) do
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      base_date: Date.new(2026, 9, 21),
      aggregation_started_on: Date.new(2021, 9, 21),
      frequency_started_on: Date.new(2025, 9, 21),
      status: "completed",
      completed_at: Time.current
    )
  end

  let(:customer) do
    create(:customer)
  end

  let(:rf_rank) do
    master = create(
      :standard_master,
      system_key: "rf_rank",
      name: "RFランク"
    )

    create(
      :standard_list_master,
      standard_master: master,
      code: "A",
      label: "Aランク"
    )
  end

  it "RFランクが設定されていれば有効" do
    result = described_class.new(
      rf_calculation_run: calculation_run,
      customer: customer,
      rf_rank: rf_rank,
      recency_days: 30,
      frequency_count: 5,
      last_visit_on: Date.new(2026, 8, 22)
    )

    expect(result).to be_valid
  end

  it "集計対象外理由が設定されていれば有効" do
    result = described_class.new(
      rf_calculation_run: calculation_run,
      customer: customer,
      exclusion_reason: "manual_customer_rank",
      frequency_count: 0
    )

    expect(result).to be_valid
  end

  it "RFランクと集計対象外理由が両方ない場合は無効" do
    result = described_class.new(
      rf_calculation_run: calculation_run,
      customer: customer,
      frequency_count: 0
    )

    expect(result).not_to be_valid
    expect(result.errors[:base]).to be_present
  end

  it "RFランクと集計対象外理由を同時に設定できない" do
    result = described_class.new(
      rf_calculation_run: calculation_run,
      customer: customer,
      rf_rank: rf_rank,
      exclusion_reason: "manual_customer_rank",
      frequency_count: 0
    )

    expect(result).not_to be_valid
    expect(result.errors[:base]).to be_present
  end

  it "RFランク以外の基本コードは指定できない" do
    customer_rank_master = create(
      :standard_master,
      system_key: "customer_rank",
      name: "顧客ランク"
    )

    customer_rank = create(
      :standard_list_master,
      standard_master: customer_rank_master,
      code: "R",
      label: "Rランク"
    )

    result = described_class.new(
      rf_calculation_run: calculation_run,
      customer: customer,
      rf_rank: customer_rank,
      frequency_count: 1
    )

    expect(result).not_to be_valid
    expect(result.errors[:rf_rank]).to be_present
  end
end
