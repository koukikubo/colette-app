require "rails_helper"
require Rails.root.join("db/migrate/20261021000002_backfill_rf_rank_initial_settings").to_s

RSpec.describe BackfillRfRankInitialSettings, type: :model do
  let(:migration) { described_class.new }
  let(:master) { create(:standard_master, system_key: "rf_rank") }
  let!(:no_visit_rank) do
    create(:standard_list_master, standard_master: master, code: "N").tap do |rank|
      rank.update_column(:initial_display_color, nil)
    end
  end

  def create_rule_set(version:, **attributes)
    RfRuleSet.create!(
      name: "移行確認用ルール",
      version: version,
      aggregation_months: 60,
      frequency_window_months: 12,
      **attributes
    )
  end

  it "変更済みの表示色と履歴を維持し、従来の初期色とNランクIDを補完する" do
    rank = create(:standard_list_master, standard_master: master,
                  code: "A", display_color: "#112233", active: false)
    rank.update_column(:initial_display_color, nil)
    snapshots = [ { "id" => rank.id, "label" => "当時の名前", "display_color" => "#445566" } ]
    rule_set = create_rule_set(version: 1, status: "archived", rf_rank_snapshots: snapshots)

    migration.up

    expect(rank.reload.initial_display_color).to eq("#059669")
    expect(rank.display_color).to eq("#112233")
    expect(no_visit_rank.reload.initial_display_color).to eq("#94A3B8")
    expect(rule_set.reload.no_visit_rank_id).to eq(no_visit_rank.id)
    expect(rule_set.rf_rank_snapshots).to eq(snapshots)
  end

  it "再実行しても保存済みの初期色とランクIDを上書きしない" do
    rank = create(:standard_list_master, standard_master: master,
                  code: nil, initial_display_color: "#123456")
    rule_set = create_rule_set(version: 1, no_visit_rank_id: rank.id)

    2.times { migration.up }

    expect(rank.reload.initial_display_color).to eq("#123456")
    expect(rule_set.reload.no_visit_rank_id).to eq(rank.id)
  end

  it "RFランク以外を補完せず、旧コードがないRFランクには共通初期色を設定する" do
    other_rank = create(:standard_list_master, code: "A")
    custom_rank = create(:standard_list_master, standard_master: master, code: nil)
    custom_rank.update_column(:initial_display_color, nil)

    migration.up

    expect(other_rank.reload.initial_display_color).to be_nil
    expect(custom_rank.reload.initial_display_color).to eq("#64748B")
  end

  it "対象ルールがあるのに有効なNランクがなければ停止する" do
    create_rule_set(version: 1)
    no_visit_rank.update!(active: false)

    expect { migration.up }.to raise_error(ActiveRecord::MigrationError, /来店履歴なしランク/)
  end
end
