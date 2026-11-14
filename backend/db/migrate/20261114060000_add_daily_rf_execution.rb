class AddDailyRfExecution < ActiveRecord::Migration[8.1]
  def up
    add_column :rf_calculation_runs, :scheduled_on, :date
    add_index :rf_calculation_runs, :scheduled_on, unique: true, where: "scheduled_on IS NOT NULL"
    remove_check_constraint :rf_calculation_runs, name: "rf_execution_source_valid"
    add_check_constraint :rf_calculation_runs, "execution_source IN ('manual', 'monthly', 'daily')", name: "rf_execution_source_valid"
  end

  def down
    # 日次履歴を削除・手動扱いに書き換えて切り戻すことはしない。
    if select_value("SELECT EXISTS (SELECT 1 FROM rf_calculation_runs WHERE execution_source = 'daily')")
      raise ActiveRecord::IrreversibleMigration, "日次履歴が存在するため、旧版へ戻す前に互換性を確認してください"
    end
    remove_check_constraint :rf_calculation_runs, name: "rf_execution_source_valid"
    add_check_constraint :rf_calculation_runs, "execution_source IN ('manual', 'monthly')", name: "rf_execution_source_valid"
    remove_column :rf_calculation_runs, :scheduled_on
  end
end
