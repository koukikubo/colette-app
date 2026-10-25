require "rails_helper"

RSpec.describe "RFルールの初期データ", type: :model do
  def seed_rf_rules
    load Rails.root.join("db/seeds/rf_rules.rb")
  end

  it "旧コードを持たないランクを生成し、IDで初期ルールを構成する" do
    seed_rf_rules

    rule_set = RfRuleSet.first!
    ranks = StandardMaster.find_by!(system_key: "rf_rank").standard_list_masters
    expect(ranks.count).to eq(7)
    expect(ranks.pluck(:code)).to all(be_nil)
    expect(rule_set.no_visit_rank).to be_present
    expect(rule_set.no_visit_rank.label).to eq("来店履歴なし")
    expect(Rf::RuleSetValidator.call(rule_set)).to be_valid
    expect(rule_set.rank_mappings.count).to eq(25)
  end

  it "再実行しても既存の名前・色・ID・設定を上書きしない" do
    seed_rf_rules
    rule_set = RfRuleSet.first!
    rank = rule_set.no_visit_rank
    rank.update!(label: "改名した未訪問", display_color: "#123456", position: 99)
    attributes = rank.attributes

    expect { seed_rf_rules }.not_to change(RfRuleSet, :count)
    expect(rank.reload.attributes).to eq(attributes)
    expect(rule_set.reload.no_visit_rank_id).to eq(rank.id)
  end

  it "既存ランクだけがある場合に役割を推測して初期ルールを作らない" do
    master = create(:standard_master, system_key: "rf_rank")
    rank = create(:standard_list_master, standard_master: master, code: nil)

    expect { seed_rf_rules }.to raise_error(RuntimeError, /既存のRFランク/)
    expect(RfRuleSet.count).to eq(0)
    expect(rank.reload).to be_persisted
  end
end
