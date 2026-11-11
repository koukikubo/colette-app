require "rails_helper"

RSpec.describe Rf::RankDropPredictionList do
  # 9月1日から90日後は11月30日。
  # 翌12月1日にRecency条件が変わる設定で検証する。
  let(:base_date) { Date.new(2026, 11, 29) }
  let(:until_date) { Date.new(2026, 12, 10) }

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
      name: "低下予定一覧テスト",
      no_visit_rank: rank_n,
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published"
    )
  end

  # 予約モデルは、席種と予約状態のカテゴリも検証する。
  # 任意の基本コードではなく、用途の合うマスタを用意する。
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

  before do
    # R条件：最終来店から90日以内／91日以上。
    recent = rule_set.recency_rules.create!(
      code: "R1", label: "90日以内",
      min_days: 0, max_days: 90, position: 1
    )
    old = rule_set.recency_rules.create!(
      code: "R2", label: "91日以上",
      min_days: 91, max_days: nil, position: 2
    )

    # F条件：集計期間内の来店が1回以下／2回以上。
    low = rule_set.frequency_rules.create!(
      code: "F1", label: "1回以下",
      min_visits: 0, max_visits: 1, position: 1
    )
    high = rule_set.frequency_rules.create!(
      code: "F2", label: "2回以上",
      min_visits: 2, max_visits: nil, position: 2
    )

    # 最近・高頻度ほど上位になるランク対応。
    [
      [ recent, high, rank_a ],
      [ recent, low, rank_b ],
      [ old, high, rank_c ],
      [ old, low, rank_d ]
    ].each do |recency, frequency, rank|
      rule_set.rank_mappings.create!(
        rf_recency_rule: recency,
        rf_frequency_rule: frequency,
        rf_rank: rank
      )
    end
  end

  # テストごとの差は顧客と予約データで表現する。
  # Predictorはモックせず、実際の計算結果を検証する。
  def prediction_list
    described_class.call(
      rule_set: rule_set,
      base_date: base_date,
      until_date: until_date
    )
  end

  it "期限内に低下する顧客だけを返す" do
    dropping = create(:customer)
    stable = create(:customer)
    create(:customer) # 来店履歴なしの顧客も含まれない。

    create_visit(dropping, Date.new(2026, 9, 1))
    create_visit(stable, Date.new(2026, 11, 20))

    rows = prediction_list

    expect(rows.map { |row| row.customer.id }).to eq([ dropping.id ])
    expect(rows.first.prediction.predicted_drop_on)
      .to eq(Date.new(2026, 12, 1))
    expect(rows.first.prediction.days_until_drop).to eq(2)
    expect(rows.first.prediction.current_rank).to eq(rank_b)
    expect(rows.first.prediction.predicted_rank).to eq(rank_d)
  end

  it "顧客IDではなく低下予定日が近い順に返す" do
    # 遅く低下する顧客を先に登録し、ID順との違いを確認する。
    later = create(:customer)
    earlier = create(:customer)

    create_visit(later, Date.new(2026, 9, 2))
    create_visit(earlier, Date.new(2026, 9, 1))

    rows = prediction_list

    expect(rows.map { |row| row.customer.id })
      .to eq([ earlier.id, later.id ])
    expect(rows.map { |row| row.prediction.predicted_drop_on })
      .to eq([ Date.new(2026, 12, 1), Date.new(2026, 12, 2) ])
  end

  it "同じ低下予定日なら顧客ID順に返す" do
    first = create(:customer)
    second = create(:customer)

    # 予約の登録順が並び順に影響しないことも確認する。
    create_visit(second, Date.new(2026, 9, 1))
    create_visit(first, Date.new(2026, 9, 1))

    expect(prediction_list.map { |row| row.customer.id })
      .to eq([ first.id, second.id ])
  end

  it "非表示の顧客を含めない" do
    customer = create(:customer, :hidden)
    create_visit(customer, Date.new(2026, 9, 1))

    expect(prediction_list).to be_empty
  end

  it "RF計算対象外の顧客を含めない" do
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
    customer = create(:customer, customer_rank: excluded_rank)
    create_visit(customer, Date.new(2026, 9, 1))

    expect(prediction_list).to be_empty
  end

  it "未完了とキャンセル済みの予約を来店として扱わない" do
    customer = create(:customer)
    create_visit(customer, Date.new(2026, 9, 1))

    # これらを誤って含めると最終来店日が新しくなり、
    # 本来12月1日に低下する顧客が一覧から消えてしまう。
    create_visit(customer, Date.new(2026, 11, 20), state: :pending)
    create_visit(customer, Date.new(2026, 11, 21), state: :canceled)

    row = prediction_list.sole

    expect(row.customer.id).to eq(customer.id)
    expect(row.prediction.predicted_drop_on)
      .to eq(Date.new(2026, 12, 1))
    expect(row.prediction.current_rank).to eq(rank_b)
  end

  it "基準日より後の来店を予測に含めない" do
    customer = create(:customer)
    create_visit(customer, Date.new(2026, 9, 1))

    # 将来の完了データが存在しても、予測時点では利用しない。
    create_visit(customer, Date.new(2026, 11, 30))

    expect(prediction_list.sole.prediction.predicted_drop_on)
      .to eq(Date.new(2026, 12, 1))
  end

  it "Frequencyの低下も実際の来店履歴から予測する" do
    customer = create(:customer)
    create_visit(customer, Date.new(2025, 11, 30))
    create_visit(customer, Date.new(2026, 11, 20))

    # 12月1日に前年11月30日の来店が集計期間から外れ、
    # 2回から1回になってAからBへ低下する。
    prediction = prediction_list.sole.prediction

    expect(prediction.predicted_drop_on).to eq(Date.new(2026, 12, 1))
    expect(prediction.current_rank).to eq(rank_a)
    expect(prediction.predicted_rank).to eq(rank_b)
  end

  it "対象顧客がいなくても不正な期間を拒否する" do
    # 顧客ループ内でだけ検証すると、0件の場合に見逃すため。
    expect {
      described_class.call(
        rule_set: rule_set,
        base_date: base_date,
        until_date: base_date
      )
    }.to raise_error(ArgumentError, "予測期限は基準日より後を指定してください")
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

  # 予約状態に応じて完了・キャンセル日時を設定する。
  # 完了とキャンセルは同時成立させない。
  def create_visit(customer, date, state: :completed)
    starts_at = Time.zone.local(date.year, date.month, date.day, 18)

    create(
      :reservation,
      customer: customer,
      starts_at: starts_at,
      ends_at: starts_at + 2.hours,
      completed_at: state == :completed ? starts_at + 2.hours : nil,
      canceled_at: state == :canceled ? starts_at - 1.hour : nil,
      requested_restaurant_master_type: restaurant_master_type,
      reservation_status: reservation_status
    )
  end
end
