require "rails_helper"

RSpec.describe Rf::CustomerRankDropPredictor do
  let(:base_date) { Date.new(2026, 11, 29) }
  let(:until_date) { Date.new(2026, 12, 10) }
  let(:customer) { create(:customer) }

  let(:rf_rank_master) do
    create(:standard_master, system_key: "rf_rank", name: "RFランク")
  end

  let!(:rank_a) { create_rank("A", 1) }
  let!(:rank_b) { create_rank("B", 2) }
  let!(:rank_c) { create_rank("C", 3) }
  let!(:rank_d) { create_rank("D", 4) }
  let!(:rank_n) { create_rank("N", 5) }

  let(:rule_set) do
    RfRuleSet.create!(
      name: "低下予測テスト",
      no_visit_rank: rank_n,
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  let(:recent_rule) do
    rule_set.recency_rules.create!(
      code: "R1",
      label: "90日以内",
      min_days: 0,
      max_days: 90,
      position: 1
    )
  end

  let(:old_rule) do
    rule_set.recency_rules.create!(
      code: "R2",
      label: "91日以上",
      min_days: 91,
      max_days: nil,
      position: 2
    )
  end

  let(:low_frequency_rule) do
    rule_set.frequency_rules.create!(
      code: "F1",
      label: "1回以下",
      min_visits: 0,
      max_visits: 1,
      position: 1
    )
  end

  let(:high_frequency_rule) do
    rule_set.frequency_rules.create!(
      code: "F2",
      label: "2回以上",
      min_visits: 2,
      max_visits: nil,
      position: 2
    )
  end

  let(:visit_dates) { [ Date.new(2026, 9, 1) ] }

  before do
    create_mapping(recent_rule, low_frequency_rule, rank_b)
    create_mapping(recent_rule, high_frequency_rule, rank_a)
    create_mapping(old_rule, low_frequency_rule, rank_d)
    create_mapping(old_rule, high_frequency_rule, rank_c)
  end

  def predict
    described_class.call(
      customer: customer,
      rule_set: rule_set,
      base_date: base_date,
      until_date: until_date,
      visit_dates: visit_dates
    )
  end

  it "Recencyが90日を超える最初の日を返す" do
    result = predict

    # 9月1日から11月30日までは90日。
    # 12月1日に91日となり、BからDへ低下する。
    expect(result.base_date).to eq(base_date)
    expect(result.predicted_drop_on).to eq(Date.new(2026, 12, 1))
    expect(result.days_until_drop).to eq(2)
    expect(result.current_rank).to eq(rank_b)
    expect(result.predicted_rank).to eq(rank_d)
  end

  context "基準日が低下予定日の前日の場合" do
    let(:base_date) { Date.new(2026, 11, 30) }

    it "残り1日を返す" do
      result = predict

      expect(result.predicted_drop_on).to eq(Date.new(2026, 12, 1))
      expect(result.days_until_drop).to eq(1)
    end
  end

  context "Frequencyの集計期間から来店が外れる場合" do
    let(:visit_dates) do
      [
        Date.new(2025, 11, 30),
        Date.new(2026, 11, 20)
      ]
    end

    it "来店回数が2回から1回になる最初の日を返す" do
      result = predict

      # 11月30日は前年11月30日の来店を含む。
      # 12月1日にその来店が期間外となり、AからBへ低下する。
      expect(result.predicted_drop_on).to eq(Date.new(2026, 12, 1))
      expect(result.days_until_drop).to eq(2)
      expect(result.current_rank).to eq(rank_a)
      expect(result.predicted_rank).to eq(rank_b)
    end
  end

  context "予測期限が低下予定日と同日の場合" do
    let(:until_date) { Date.new(2026, 12, 1) }

    it "期限当日の低下も返す" do
      expect(predict.predicted_drop_on).to eq(until_date)
    end
  end

  context "期限内に低下しない場合" do
    let(:until_date) { Date.new(2026, 11, 30) }

    it "nilを返す" do
      expect(predict).to be_nil
    end
  end

  context "基準日より後の来店が含まれる場合" do
    let(:visit_dates) do
      [
        Date.new(2026, 9, 1),
        Date.new(2026, 11, 30)
      ]
    end

    it "将来の来店を含めずに予測する" do
      result = predict

      expect(result.current_rank).to eq(rank_b)
      expect(result.predicted_drop_on).to eq(Date.new(2026, 12, 1))
    end
  end

  context "同じ日に複数回来店した場合" do
    let(:visit_dates) do
      [ Date.new(2026, 9, 1), Date.new(2026, 9, 1) ]
    end

    it "来店回数を重複除去せず計算する" do
      result = predict

      expect(result.current_rank).to eq(rank_a)
      expect(result.predicted_rank).to eq(rank_c)
    end
  end

  context "来店履歴がない場合" do
    let(:visit_dates) { [] }

    it "nilを返す" do
      expect(predict).to be_nil
    end
  end

  context "RF計算対象外の顧客の場合" do
    before do
      master = create(
        :standard_master,
        system_key: "customer_rank",
        name: "顧客ランク"
      )
      excluded_rank = create(
        :standard_list_master,
        standard_master: master,
        code: "R",
        label: "RF対象外"
      )
      customer.update!(customer_rank: excluded_rank)
    end

    it "nilを返す" do
      expect(predict).to be_nil
    end
  end

  context "予測中に来店履歴なしへ移行する場合" do
    let(:visit_dates) { [ base_date.advance(months: -1) ] }

    before do
      rule_set.update!(
        aggregation_months: 1,
        frequency_window_months: 1
      )
    end

    it "未訪問への移行を通常ランク低下として返さない" do
      expect(predict).to be_nil
    end
  end

  it "基準日と同じ予測期限を拒否する" do
    expect {
      described_class.call(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date,
        until_date: base_date,
        visit_dates: visit_dates
      )
    }.to raise_error(ArgumentError, "予測期限は基準日より後を指定してください")
  end

  it "基準日より前の予測期限を拒否する" do
    expect {
      described_class.call(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date,
        until_date: base_date.prev_day,
        visit_dates: visit_dates
      )
    }.to raise_error(ArgumentError)
  end

  it "予測によって顧客とRFルールを更新しない" do
    customer_before = customer.reload.attributes
    rule_set_before = rule_set.reload.attributes

    result = predict

    expect(result).to be_present
    expect(customer.reload.attributes).to eq(customer_before)
    expect(rule_set.reload.attributes).to eq(rule_set_before)
  end

  private

  def create_rank(code, position)
    create(
      :standard_list_master,
      standard_master: rf_rank_master,
      code: code,
      label: "#{code}ランク",
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
end
