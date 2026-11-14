class AddMonthlyRfExecution < ActiveRecord::Migration[8.1]
  def change
    add_column :rf_calculation_runs, :execution_source, :string, null: false, default: "manual"
    add_column :rf_calculation_runs, :scheduled_month, :date
    add_column :rf_calculation_runs, :expected_setting_version, :integer
    add_column :rf_calculation_runs, :monthly_apply_state, :string
    add_column :rf_calculation_runs, :monthly_apply_error, :string
    add_index :rf_calculation_runs, :scheduled_month, unique: true, where: "scheduled_month IS NOT NULL"
    add_check_constraint :rf_calculation_runs, "execution_source IN ('manual', 'monthly')", name: "rf_execution_source_valid"
    add_check_constraint :rf_calculation_runs, "monthly_apply_state IS NULL OR monthly_apply_state IN ('pending', 'applied', 'conflict', 'failed')", name: "rf_monthly_apply_state_valid"
  end
end
