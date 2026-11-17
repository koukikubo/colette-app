class CreateRfCalculationHistory < ActiveRecord::Migration[8.1]
  def change
    create_table :rf_calculation_runs do |t|
      t.references :rf_rule_set,
                   null: false,
                   foreign_key: true

      t.references :previous_run,
                   null: true,
                   foreign_key: false

      t.references :started_by_staff,
                   null: true,
                   foreign_key: {
                     to_table: :staffs
                   }

      t.date :base_date,
             null: false

      t.date :aggregation_started_on,
             null: false

      t.date :frequency_started_on,
             null: false

      t.string :status,
               null: false,
               default: "pending"

      t.integer :customer_count,
                null: false,
                default: 0

      t.integer :excluded_count,
                null: false,
                default: 0

      t.integer :unmatched_count,
                null: false,
                default: 0

      t.datetime :started_at
      t.datetime :completed_at
      t.text :failure_message

      t.integer :lock_version,
                null: false,
                default: 0

      t.timestamps
    end

    add_foreign_key :rf_calculation_runs,
                    :rf_calculation_runs,
                    column: :previous_run_id

    add_index :rf_calculation_runs,
              :base_date

    add_index :rf_calculation_runs,
              :status

    add_check_constraint :rf_calculation_runs,
                         "status IN ('pending', 'processing', 'completed', 'failed')",
                         name: "check_rf_calculation_runs_status"

    add_check_constraint :rf_calculation_runs,
                         "customer_count >= 0",
                         name: "check_rf_calculation_runs_customer_count"

    add_check_constraint :rf_calculation_runs,
                         "excluded_count >= 0",
                         name: "check_rf_calculation_runs_excluded_count"

    add_check_constraint :rf_calculation_runs,
                         "unmatched_count >= 0",
                         name: "check_rf_calculation_runs_unmatched_count"

    create_table :customer_rf_rank_results do |t|
      t.references :rf_calculation_run,
                   null: false,
                   foreign_key: true

      t.references :customer,
                   null: false,
                   foreign_key: true

      t.references :rf_rank,
                   null: true,
                   foreign_key: {
                     to_table: :standard_list_masters
                   }

      t.integer :recency_days
      t.integer :frequency_count,
                null: false,
                default: 0

      t.date :last_visit_on
      t.string :exclusion_reason

      t.timestamps
    end

    add_index :customer_rf_rank_results,
              [ :rf_calculation_run_id, :customer_id ],
              unique: true,
              name: "idx_customer_rf_results_on_run_and_customer"

    add_check_constraint :customer_rf_rank_results,
                         "recency_days IS NULL OR recency_days >= 0",
                         name: "check_customer_rf_results_recency_days"

    add_check_constraint :customer_rf_rank_results,
                         "frequency_count >= 0",
                         name: "check_customer_rf_results_frequency_count"

    create_table :rf_settings do |t|
      t.boolean :singleton_key,
                null: false,
                default: true

      t.references :current_calculation_run,
                   null: true,
                   foreign_key: {
                     to_table: :rf_calculation_runs
                   }

      t.integer :lock_version,
                null: false,
                default: 0

      t.timestamps
    end

    add_index :rf_settings,
              :singleton_key,
              unique: true

    add_check_constraint :rf_settings,
                         "singleton_key = TRUE",
                         name: "check_rf_settings_singleton"
  end
end
