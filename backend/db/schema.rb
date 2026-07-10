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

ActiveRecord::Schema[8.1].define(version: 2026_07_07_234327) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.index ["created_by_staff_id"], name: "index_reservations_on_created_by_staff_id"
    t.index ["customer_id"], name: "index_reservations_on_customer_id"
    t.index ["menu_type_id"], name: "index_reservations_on_menu_type_id"
    t.index ["occasion_id"], name: "index_reservations_on_occasion_id"
    t.index ["requested_restaurant_master_type_id"], name: "idx_reservations_on_requested_table_type_id"
    t.index ["reservation_route_id"], name: "index_reservations_on_reservation_route_id"
    t.index ["reservation_status_id"], name: "index_reservations_on_reservation_status_id"
    t.index ["starts_at"], name: "index_reservations_on_starts_at"
    t.index ["updated_by_staff_id"], name: "index_reservations_on_updated_by_staff_id"
    t.check_constraint "char_length(btrim(reservation_name::text)) > 0", name: "check_reservations_name_not_blank"
    t.check_constraint "char_length(btrim(reservation_phone_number::text)) > 0", name: "check_reservations_phone_not_blank"
    t.check_constraint "ends_at > starts_at", name: "check_reservations_ends_at_after_starts_at"
    t.check_constraint "guest_count > 0", name: "check_reservations_guest_count_positive"
    t.check_constraint "lock_version >= 0", name: "check_reservations_lock_version_non_negative"
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

  add_foreign_key "customers", "staffs", column: "created_by_staff_id"
  add_foreign_key "customers", "staffs", column: "updated_by_staff_id"
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
  add_foreign_key "staffs", "staff_masters"
  add_foreign_key "standard_list_masters", "standard_masters"
end
