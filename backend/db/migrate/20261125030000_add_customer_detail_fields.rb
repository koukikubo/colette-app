class AddCustomerDetailFields < ActiveRecord::Migration[8.1]
  def change
    add_column :standard_masters, :customer_detail_mode, :string, null: false, default: "none"
    add_column :standard_masters, :customer_detail_group, :string, limit: 50
    add_check_constraint :standard_masters, "customer_detail_mode IN ('none', 'single', 'multiple')", name: "customer_detail_mode_valid"
    add_check_constraint :standard_masters, "customer_detail_mode = 'none' OR system_key IS NULL", name: "customer_details_custom_codes_only"

    # 親コードは選択肢から導出する。親IDの二重保存による取り違えを作らない。
    create_table :customer_detail_selections do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :standard_list_master, null: false, foreign_key: true
      t.timestamps
    end
    add_index :customer_detail_selections, [ :customer_id, :standard_list_master_id ], unique: true, name: "idx_customer_detail_unique_choice"
  end
end
