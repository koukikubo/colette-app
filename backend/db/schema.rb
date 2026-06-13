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

ActiveRecord::Schema[8.1].define(version: 2026_05_23_044400) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.boolean "login_enabled", default: true, null: false
    t.string "password_digest", null: false
    t.bigint "staff_master_id", null: false
    t.datetime "updated_at", null: false
    t.index ["staff_master_id"], name: "index_staffs_on_staff_master_id", unique: true
    t.check_constraint "failed_attempts >= 0", name: "check_staffs_failed_attempts_non_negative"
  end

  create_table "standard_list_masters", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "label", null: false
    t.integer "position", default: 0, null: false
    t.bigint "standard_master_id", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_standard_list_masters_on_active"
    t.index ["standard_master_id", "code"], name: "index_standard_list_masters_on_master_id_and_code", unique: true
    t.index ["standard_master_id", "position"], name: "index_standard_list_masters_on_master_id_and_position", unique: true
    t.index ["standard_master_id"], name: "index_standard_list_masters_on_standard_master_id"
  end

  create_table "standard_masters", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_standard_masters_on_active"
    t.index ["code"], name: "index_standard_masters_on_code", unique: true
    t.index ["name"], name: "index_standard_masters_on_name"
    t.index ["position"], name: "index_standard_masters_on_position", unique: true
  end

  add_foreign_key "staffs", "staff_masters"
  add_foreign_key "standard_list_masters", "standard_masters"
end
