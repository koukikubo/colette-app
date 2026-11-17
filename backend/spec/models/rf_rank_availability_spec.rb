require "rails_helper"

RSpec.describe "使用中RFランクの無効化保護", type: :model do
  let(:master) { create(:standard_master, system_key: "rf_rank") }
  let(:rank) { create(:standard_list_master, standard_master: master) }
  let(:other) { create(:standard_list_master, standard_master: master) }
  let(:rule) { RfRuleSet.create!(name: "有効ルール", version: 1, status: "published", aggregation_months: 60, frequency_window_months: 12, no_visit_rank: rank) }

  it "公開ルールの未訪問ランクを停止できない" do
    rule
    expect(rank.update(active: false)).to be(false)
    expect(rank.reload).to be_active
  end

  it "公開ルールの対応表に使うランクも停止できない" do
    r = rule.recency_rules.create!(code: "R", label: "R", min_days: 0, position: 1)
    f = rule.frequency_rules.create!(code: "F", label: "F", min_visits: 0, position: 1)
    rule.rank_mappings.create!(rf_recency_rule: r, rf_frequency_rule: f, rf_rank: other)
    expect(other.update(active: false)).to be(false)
  end

  it "RF親カテゴリの停止も拒否する" do
    rule
    expect(master.update(active: false)).to be(false)
  end

  it "アーカイブ済みでも現在適用中のルールは保護する" do
    rule.update!(status: "archived")
    run = RfCalculationRun.create!(rf_rule_set: rule, base_date: Date.current, aggregation_started_on: 5.years.ago.to_date, frequency_started_on: 1.year.ago.to_date, status: "completed")
    RfSetting.create!(current_calculation_run: run)
    expect(rank.update(active: false)).to be(false)
  end

  it "使用していないランクは停止できる" do
    rule
    expect(other.update(active: false)).to be(true)
  end
  it "アーカイブ済みでも計算待ちのルールは保護する" do
    rule.update!(status: "archived")
    RfCalculationRun.create!(rf_rule_set: rule, base_date: Date.current,
                            aggregation_started_on: 5.years.ago.to_date,
                            frequency_started_on: 1.year.ago.to_date)
    expect(rank.update(active: false)).to be(false)
  end

  it "未使用のアーカイブルールと下書きは停止を妨げない" do
    rule.update!(status: "archived")
    expect(rank.update(active: false)).to be(true)
  end
end
