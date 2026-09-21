require "rails_helper"

RSpec.describe Rf::CalculationRunner do
  let(:base_date) do
    Date.new(2026, 9, 21)
  end

  let(:staff) do
    create(:staff)
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "公開済みRFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published",
      published_at: Time.current
    )
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

  let(:valid_rule_result) do
    Rf::RuleSetValidator::Result.new(
      errors: [],
      warnings: []
    )
  end

  before do
    allow(Rf::RuleSetValidator)
      .to receive(:call)
      .and_return(valid_rule_result)
  end

  it "表示中の全顧客について計算結果を保存する" do
    first_customer = create(:customer)
    second_customer = create(:customer)
    create(:customer, hidden_at: Time.current)

    calculation_result =
      Rf::CustomerRankCalculator::Result.new(
        rf_rank: rf_rank,
        recency_days: 20,
        frequency_count: 2,
        last_visit_on: Date.new(2026, 9, 1)
      )

    allow(Rf::CustomerRankCalculator)
      .to receive(:call)
      .and_return(calculation_result)

    calculation_run =
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )

    expect(calculation_run.status).to eq("completed")
    expect(calculation_run.customer_count).to eq(2)

    expect(
      calculation_run
        .customer_rf_rank_results
        .pluck(:customer_id)
    ).to contain_exactly(
      first_customer.id,
      second_customer.id
    )
  end

  it "計算途中で失敗した場合は結果を保存せず失敗状態にする" do
    create(:customer)

    allow(Rf::CustomerRankCalculator)
      .to receive(:call)
      .and_raise(StandardError, "計算に失敗しました")

    expect do
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )
    end.to raise_error(
      StandardError,
      "計算に失敗しました"
    )

    calculation_run = RfCalculationRun.last

    expect(calculation_run.status).to eq("failed")
    expect(calculation_run.failure_message)
      .to eq("計算に失敗しました")

    expect(
      calculation_run.customer_rf_rank_results
    ).to be_empty
  end

  it "公開前のRFルールでは計算を開始しない" do
    rule_set.update!(status: "draft")

    expect do
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: staff
      )
    end.to raise_error(
      Rf::CalculationRunner::InvalidRuleSetError,
      "公開済みのRFルールを指定してください"
    )

    expect(RfCalculationRun.count).to eq(0)
  end
end
