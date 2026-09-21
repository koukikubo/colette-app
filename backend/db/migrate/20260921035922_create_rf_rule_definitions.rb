class CreateRfRuleDefinitions < ActiveRecord::Migration[8.1]
  def change
    create_table :rf_rule_sets do |t|
      t.string :name, null: false
      t.integer :version, null: false

      # RF分析で参照できる履歴全体の期間。
      t.integer :aggregation_months,
                null: false,
                default: 60

      # F（来店回数）を数える期間。
      t.integer :frequency_window_months,
                null: false,
                default: 12

      t.string :status,
               null: false,
               default: "draft"

      t.datetime :published_at

      t.references :created_by_staff,
                   null: true,
                   foreign_key: {
                     to_table: :staffs
                   }

      t.integer :lock_version,
                null: false,
                default: 0

      t.timestamps
    end

    add_index :rf_rule_sets,
              :version,
              unique: true

    add_check_constraint :rf_rule_sets,
                         "aggregation_months > 0",
                         name: "check_rf_rule_sets_aggregation_months"

    add_check_constraint :rf_rule_sets,
                         "frequency_window_months > 0",
                         name: "check_rf_rule_sets_frequency_window_months"

    add_check_constraint :rf_rule_sets,
                         "frequency_window_months <= aggregation_months",
                         name: "check_rf_rule_sets_frequency_within_aggregation"

    add_check_constraint :rf_rule_sets,
                         "status IN ('draft', 'published', 'archived')",
                         name: "check_rf_rule_sets_status"

    create_table :rf_recency_rules do |t|
      t.references :rf_rule_set,
                   null: false,
                   foreign_key: true

      t.string :code, null: false
      t.string :label, null: false

      # 最終来店からの経過日数。
      t.integer :min_days, null: false
      t.integer :max_days

      t.integer :position, null: false

      t.timestamps
    end

    add_index :rf_recency_rules,
              [ :rf_rule_set_id, :code ],
              unique: true

    add_index :rf_recency_rules,
              [ :rf_rule_set_id, :position ],
              unique: true

    add_check_constraint :rf_recency_rules,
                         "min_days >= 0",
                         name: "check_rf_recency_rules_min_days"

    add_check_constraint :rf_recency_rules,
                         "max_days IS NULL OR max_days >= min_days",
                         name: "check_rf_recency_rules_range"

    create_table :rf_frequency_rules do |t|
      t.references :rf_rule_set,
                   null: false,
                   foreign_key: true

      t.string :code, null: false
      t.string :label, null: false

      # frequency_window_months内の来店回数。
      t.integer :min_visits, null: false
      t.integer :max_visits

      t.integer :position, null: false

      t.timestamps
    end

    add_index :rf_frequency_rules,
              [ :rf_rule_set_id, :code ],
              unique: true

    add_index :rf_frequency_rules,
              [ :rf_rule_set_id, :position ],
              unique: true

    add_check_constraint :rf_frequency_rules,
                         "min_visits >= 0",
                         name: "check_rf_frequency_rules_min_visits"

    add_check_constraint :rf_frequency_rules,
                         "max_visits IS NULL OR max_visits >= min_visits",
                         name: "check_rf_frequency_rules_range"

    create_table :rf_rank_mappings do |t|
      t.references :rf_rule_set,
                   null: false,
                   foreign_key: true

      t.references :rf_recency_rule,
                   null: false,
                   foreign_key: true

      t.references :rf_frequency_rule,
                   null: false,
                   foreign_key: true

      # system_key: rf_rankの選択肢を参照する。
      t.references :rf_rank,
                   null: false,
                   foreign_key: {
                     to_table: :standard_list_masters
                   }

      t.timestamps
    end

    add_index :rf_rank_mappings,
              [
                :rf_rule_set_id,
                :rf_recency_rule_id,
                :rf_frequency_rule_id
              ],
              unique: true,
              name: "idx_rf_rank_mappings_on_rule_and_dimensions"
  end
end
