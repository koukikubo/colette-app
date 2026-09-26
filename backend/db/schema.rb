# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_21_054500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "btree_gist"
  enable_extension "pg_catalog.plpgsql"

  create_table "customer_rf_rank_results", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "exclusion_reason"
    t.integer "frequency_count", default: 0, null: false
    t.date "last_visit_on"
    t.integer "recency_days"
    t.bigint "rf_calculation_run_id", null: false
    t.bigint "rf_rank_id"
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_customer_rf_rank_results_on_customer_id"
    t.index ["rf_calculation_run_id", "customer_id"], name: "idx_customer_rf_results_on_run_and_customer", unique: true
    t.index ["rf_calculation_run_id"], name: "index_customer_rf_rank_results_on_rf_calculation_run_id"
    t.index ["rf_rank_id"], name: "index_customer_rf_rank_results_on_rf_rank_id"
    t.check_constraint "frequency_count >= 0", name: "check_customer_rf_results_frequency_count"
    t.check_constraint "recency_days IS NULL OR recency_days >= 0", name: "check_customer_rf_results_recency_days"
  end

  create_table "customers", force: :cascade do |t|
    t.string "address", limit: 255
    t.date "birthday"
    t.string "company_address", limit: 255
    t.string "company_email", limit: 255
    t.string "company_name", limit: 100
    t.string "company_name_kana", limit: 100
    t.string "company_phone_number", limit: 20
    t.string "company_postal_code", limit: 7
    t.datetime "created_at", null: false
    t.bigint "created_by_staff_id", null: false
    t.string "customer_kind", limit: 30, default: "individual", null: false
    t.bigint "customer_rank_id"
    t.string "email", limit: 255
    t.datetime "hidden_at"
    t.string "kana", limit: 30, null: false
    t.integer "lock_version", default: 0, null: false
    t.text "memo"
    t.string "name", limit: 30, null: false
    t.string "phone_number", limit: 20
    t.string "postal_code", limit: 7
    t.datetime "updated_at", null: false
    t.bigint "updated_by_staff_id", null: false
    t.index ["company_name"], name: "index_customers_on_company_name"
    t.index ["company_name_kana"], name: "index_customers_on_company_name_kana"
    t.index ["company_phone_number"], name: "index_customers_on_company_phone_number"
    t.index ["created_by_staff_id"], name: "index_customers_on_created_by_staff_id"
    t.index ["customer_kind"], name: "index_customers_on_customer_kind"
    t.index ["customer_rank_id"], name: "index_customers_on_customer_rank_id"
    t.index ["hidden_at", "id"], name: "index_customers_on_hidden_at_and_id"
    t.index ["kana"], name: "index_customers_on_kana"
    t.index ["name"], name: "index_customers_on_name"
    t.index ["phone_number"], name: "index_customers_on_phone_number"
    t.index ["updated_by_staff_id"], name: "index_customers_on_updated_by_staff_id"
  end

  create_table "reservation_tables", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "reservation_id", null: false
    t.bigint "restaurant_master_id", null: false
    t.datetime "updated_at", null: false
    t.index ["reservation_id", "restaurant_master_id"], name: "idx_reservation_tables_unique_assignment", unique: true
    t.index ["reservation_id"], name: "index_reservation_tables_on_reservation_id"
    t.index ["restaurant_master_id"], name: "index_reservation_tables_on_restaurant_master_id"
  end

  create_table "reservations", force: :cascade do |t|
    t.text "allergy_note"
    t.datetime "canceled_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.bigint "created_by_staff_id", null: false
    t.bigint "customer_id"
    t.datetime "details_confirmed_at"
    t.text "disliked_food_note"
    t.datetime "ends_at", null: false
    t.text "favorite_drink_note"
    t.integer "guest_count", null: false
    t.text "internal_memo"
    t.integer "lock_version", default: 0, null: false
    t.bigint "menu_type_id"
    t.bigint "occasion_id"
    t.text "preferred_food_note"
    t.text "request_note"
    t.bigint "requested_restaurant_master_type_id", null: false
    t.string "reservation_name", limit: 50, null: false
    t.string "reservation_phone_number", limit: 20, null: false
    t.bigint "reservation_route_id"
    t.bigint "reservation_status_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "updated_by_staff_id", null: false
    t.index ["canceled_at"], name: "index_reservations_on_canceled_at"
    t.index ["completed_at"], name: "index_reservations_on_completed_at"
    t.index ["created_by_staff_id"], name: "index_reservations_on_created_by_staff_id"
    t.index ["customer_id"], name: "index_reservations_on_customer_id"
    t.index ["menu_type_id"], name: "index_reservations_on_menu_type_id"
    t.index ["occasion_id"], name: "index_reservations_on_occasion_id"
    t.index ["requested_restaurant_master_type_id"], name: "idx_reservations_on_requested_table_type_id"
    t.index ["reservation_route_id"], name: "index_reservations_on_reservation_route_id"
    t.index ["reservation_status_id"], name: "index_reservations_on_reservation_status_id"
    t.index ["starts_at"], name: "index_reservations_on_starts_at"
    t.index ["updated_by_staff_id"], name: "index_reservations_on_updated_by_staff_id"
    t.check_constraint "NOT (completed_at IS NOT NULL AND canceled_at IS NOT NULL)", name: "check_reservations_not_completed_and_canceled"
    t.check_constraint "char_length(btrim(reservation_name::text)) > 0", name: "check_reservations_name_not_blank"
    t.check_constraint "char_length(btrim(reservation_phone_number::text)) > 0", name: "check_reservations_phone_not_blank"
    t.check_constraint "ends_at > starts_at", name: "check_reservations_ends_at_after_starts_at"
    t.check_constraint "guest_count > 0", name: "check_reservations_guest_count_positive"
    t.check_constraint "lock_version >= 0", name: "check_reservations_lock_version_non_negative"
    t.exclusion_constraint "customer_id WITH =, tsrange(starts_at, ends_at, '[)'::text) WITH &&", where: "(customer_id IS NOT NULL) AND (canceled_at IS NULL)", using: :gist, name: "exclude_active_customer_reservation_overlaps"
  end

  create_table "restaurant_masters", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.integer "capacity", null: false
    t.string "code", limit: 20, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_staff_id", null: false
    t.integer "lock_version", default: 0, null: false
    t.text "memo"
    t.string "name", limit: 100, null: false
    t.integer "position", default: 0, null: false
    t.bigint "restaurant_master_type_id", null: false
    t.integer "sequence_number", null: false
    t.datetime "updated_at", null: false
    t.bigint "updated_by_staff_id", null: false
    t.index ["code"], name: "index_restaurant_masters_on_code", unique: true
    t.index ["created_by_staff_id"], name: "index_restaurant_masters_on_created_by_staff_id"
    t.index ["restaurant_master_type_id", "sequence_number"], name: "idx_restaurant_masters_type_and_sequence", unique: true
    t.index ["updated_by_staff_id"], name: "index_restaurant_masters_on_updated_by_staff_id"
    t.check_constraint "\"position\" >= 0", name: "check_restaurant_masters_position_non_negative"
    t.check_constraint "capacity > 0", name: "check_restaurant_masters_capacity_positive"
    t.check_constraint "char_length(btrim(code::text)) > 0", name: "check_restaurant_masters_code_not_blank"
    t.check_constraint "char_length(btrim(name::text)) > 0", name: "check_restaurant_masters_name_not_blank"
    t.check_constraint "sequence_number > 0", name: "check_restaurant_masters_sequence_positive"
  end

  create_table "rf_calculation_runs", force: :cascade do |t|
    t.date "aggregation_started_on", null: false
    t.date "base_date", null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "customer_count", default: 0, null: false
    t.integer "excluded_count", default: 0, null: false
    t.text "failure_message"
    t.date "frequency_started_on", null: false
    t.integer "lock_version", default: 0, null: false
    t.bigint "previous_run_id"
    t.bigint "rf_rule_set_id", null: false
    t.datetime "started_at"
    t.bigint "started_by_staff_id"
    t.string "status", default: "pending", null: false
    t.integer "unmatched_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["base_date"], name: "index_rf_calculation_runs_on_base_date"
    t.index ["previous_run_id"], name: "index_rf_calculation_runs_on_previous_run_id"
    t.index ["rf_rule_set_id"], name: "index_rf_calculation_runs_on_rf_rule_set_id"
    t.index ["started_by_staff_id"], name: "index_rf_calculation_runs_on_started_by_staff_id"
    t.index ["status"], name: "index_rf_calculation_runs_on_status"
    t.check_constraint "customer_count >= 0", name: "check_rf_calculation_runs_customer_count"
    t.check_constraint "excluded_count >= 0", name: "check_rf_calculation_runs_excluded_count"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying]::text[])", name: "check_rf_calculation_runs_status"
    t.check_constraint "unmatched_count >= 0", name: "check_rf_calculation_runs_unmatched_count"
  end

  create_table "rf_frequency_rules", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.integer "max_visits"
    t.integer "min_visits", null: false
    t.integer "position", null: false
    t.bigint "rf_rule_set_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rf_rule_set_id", "code"], name: "index_rf_frequency_rules_on_rf_rule_set_id_and_code", unique: true
    t.index ["rf_rule_set_id", "position"], name: "index_rf_frequency_rules_on_rf_rule_set_id_and_position", unique: true
    t.index ["rf_rule_set_id"], name: "index_rf_frequency_rules_on_rf_rule_set_id"
    t.check_constraint "max_visits IS NULL OR max_visits >= min_visits", name: "check_rf_frequency_rules_range"
    t.check_constraint "min_visits >= 0", name: "check_rf_frequency_rules_min_visits"
  end

  create_table "rf_rank_mappings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "rf_frequency_rule_id", null: false
    t.bigint "rf_rank_id", null: false
    t.bigint "rf_recency_rule_id", null: false
    t.bigint "rf_rule_set_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rf_frequency_rule_id"], name: "index_rf_rank_mappings_on_rf_frequency_rule_id"
    t.index ["rf_rank_id"], name: "index_rf_rank_mappings_on_rf_rank_id"
    t.index ["rf_recency_rule_id"], name: "index_rf_rank_mappings_on_rf_recency_rule_id"
    t.index ["rf_rule_set_id", "rf_recency_rule_id", "rf_frequency_rule_id"], name: "idx_rf_rank_mappings_on_rule_and_dimensions", unique: true
    t.index ["rf_rule_set_id"], name: "index_rf_rank_mappings_on_rf_rule_set_id"
  end

  create_table "rf_recency_rules", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "label", null: false
    t.integer "max_days"
    t.integer "min_days", null: false
    t.integer "position", null: false
    t.bigint "rf_rule_set_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rf_rule_set_id", "code"], name: "index_rf_recency_rules_on_rf_rule_set_id_and_code", unique: true
    t.index ["rf_rule_set_id", "position"], name: "index_rf_recency_rules_on_rf_rule_set_id_and_position", unique: true
    t.index ["rf_rule_set_id"], name: "index_rf_recency_rules_on_rf_rule_set_id"
    t.check_constraint "max_days IS NULL OR max_days >= min_days", name: "check_rf_recency_rules_range"
    t.check_constraint "min_days >= 0", name: "check_rf_recency_rules_min_days"
  end

  create_table "rf_rule_sets", force: :cascade do |t|
    t.integer "aggregation_months", default: 60, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_staff_id"
    t.integer "frequency_window_months", default: 12, null: false
    t.integer "lock_version", default: 0, null: false
    t.string "name", null: false
    t.datetime "published_at"
    t.string "status", default: "draft", null: false
    t.datetime "updated_at", null: false
    t.integer "version", null: false
    t.index ["created_by_staff_id"], name: "index_rf_rule_sets_on_created_by_staff_id"
    t.index ["version"], name: "index_rf_rule_sets_on_version", unique: true
    t.check_constraint "aggregation_months > 0", name: "check_rf_rule_sets_aggregation_months"
    t.check_constraint "frequency_window_months <= aggregation_months", name: "check_rf_rule_sets_frequency_within_aggregation"
    t.check_constraint "frequency_window_months > 0", name: "check_rf_rule_sets_frequency_window_months"
    t.check_constraint "status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying]::text[])", name: "check_rf_rule_sets_status"
  end

  create_table "rf_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "current_calculation_run_id"
    t.integer "lock_version", default: 0, null: false
    t.boolean "singleton_key", default: true, null: false
    t.datetime "updated_at", null: false
    t.index ["current_calculation_run_id"], name: "index_rf_settings_on_current_calculation_run_id"
    t.index ["singleton_key"], name: "index_rf_settings_on_singleton_key", unique: true
    t.check_constraint "singleton_key = true", name: "check_rf_settings_singleton"
  end

  create_table "staff_masters", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.date "employment_started_on", null: false
    t.text "memo"
    t.string "name", null: false
    t.date "retired_on"
    t.string "role_code", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_staff_masters_on_code", unique: true
    t.index ["retired_on"], name: "index_staff_masters_on_retired_on"
    t.index ["role_code"], name: "index_staff_masters_on_role_code"
  end

  create_table "staffs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "failed_attempts", default: 0, null: false
    t.datetime "last_logged_in_at"
    t.datetime "locked_at"
    t.boolean "login_enabled", default: true, null: false
    t.string "password_digest", null: false
    t.bigint "staff_master_id", null: false
    t.datetime "updated_at", null: false
    t.index ["locked_at"], name: "index_staffs_on_locked_at"
    t.index ["staff_master_id"], name: "index_staffs_on_staff_master_id", unique: true
    t.check_constraint "failed_attempts >= 0", name: "check_staffs_failed_attempts_non_negative"
  end

  create_table "standard_list_masters", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "code"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "label", null: false
    t.integer "position", default: 0, null: false
    t.bigint "standard_master_id", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_standard_list_masters_on_active"
    t.index ["standard_master_id", "code"], name: "idx_standard_list_masters_master_and_code", unique: true
    t.index ["standard_master_id", "position"], name: "index_standard_list_masters_on_master_id_and_position", unique: true
    t.index ["standard_master_id"], name: "index_standard_list_masters_on_standard_master_id"
  end

  create_table "standard_masters", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.string "system_key"
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_standard_masters_on_active"
    t.index ["name"], name: "index_standard_masters_on_name"
    t.index ["position"], name: "index_standard_masters_on_position", unique: true
    t.index ["system_key"], name: "index_standard_masters_on_system_key", unique: true
  end

  add_foreign_key "customer_rf_rank_results", "customers"
  add_foreign_key "customer_rf_rank_results", "rf_calculation_runs"
  add_foreign_key "customer_rf_rank_results", "standard_list_masters", column: "rf_rank_id"
  add_foreign_key "customers", "staffs", column: "created_by_staff_id"
  add_foreign_key "customers", "staffs", column: "updated_by_staff_id"
  add_foreign_key "customers", "standard_list_masters", column: "customer_rank_id"
  add_foreign_key "reservation_tables", "reservations"
  add_foreign_key "reservation_tables", "restaurant_masters"
  add_foreign_key "reservations", "customers"
  add_foreign_key "reservations", "staffs", column: "created_by_staff_id"
  add_foreign_key "reservations", "staffs", column: "updated_by_staff_id"
  add_foreign_key "reservations", "standard_list_masters", column: "menu_type_id"
  add_foreign_key "reservations", "standard_list_masters", column: "occasion_id"
  add_foreign_key "reservations", "standard_list_masters", column: "requested_restaurant_master_type_id"
  add_foreign_key "reservations", "standard_list_masters", column: "reservation_route_id"
  add_foreign_key "reservations", "standard_list_masters", column: "reservation_status_id"
  add_foreign_key "restaurant_masters", "staffs", column: "created_by_staff_id"
  add_foreign_key "restaurant_masters", "staffs", column: "updated_by_staff_id"
  add_foreign_key "restaurant_masters", "standard_list_masters", column: "restaurant_master_type_id"
  add_foreign_key "rf_calculation_runs", "rf_calculation_runs", column: "previous_run_id"
  add_foreign_key "rf_calculation_runs", "rf_rule_sets"
  add_foreign_key "rf_calculation_runs", "staffs", column: "started_by_staff_id"
  add_foreign_key "rf_frequency_rules", "rf_rule_sets"
  add_foreign_key "rf_rank_mappings", "rf_frequency_rules"
  add_foreign_key "rf_rank_mappings", "rf_recency_rules"
  add_foreign_key "rf_rank_mappings", "rf_rule_sets"
  add_foreign_key "rf_rank_mappings", "standard_list_masters", column: "rf_rank_id"
  add_foreign_key "rf_recency_rules", "rf_rule_sets"
  add_foreign_key "rf_rule_sets", "staffs", column: "created_by_staff_id"
  add_foreign_key "rf_settings", "rf_calculation_runs", column: "current_calculation_run_id"
  add_foreign_key "staffs", "staff_masters"
  add_foreign_key "standard_list_masters", "standard_masters"
end
