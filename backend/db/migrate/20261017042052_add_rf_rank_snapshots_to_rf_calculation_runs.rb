class AddRfRankSnapshotsToRfCalculationRuns < ActiveRecord::Migration[8.1]
  def change
    add_column :rf_calculation_runs, :rf_rank_snapshots, :jsonb
  end
end
