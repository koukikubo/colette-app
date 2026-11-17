class AddRfRankSnapshotsToRfRuleSets < ActiveRecord::Migration[8.1]
  def change
    add_column :rf_rule_sets, :rf_rank_snapshots, :jsonb
  end
end
