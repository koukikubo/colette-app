class AddStandardCodeUsagePlaces < ActiveRecord::Migration[8.1]
  def up
    create_table :standard_code_usage_places do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.string :description
      t.integer :position, null: false
      t.timestamps
    end
    add_index :standard_code_usage_places, :key, unique: true
    execute <<~SQL
      INSERT INTO standard_code_usage_places (key, name, description, position, created_at, updated_at) VALUES
      ('customer_details', '顧客詳細', '顧客の詳細情報で選択・保存できます。', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('reservation_details', '予約詳細', '予約画面への表示・入力は後続対応です。', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    SQL
    add_reference :standard_masters, :usage_place, foreign_key: { to_table: :standard_code_usage_places }
    add_column :standard_masters, :input_type, :string, null: false, default: 'single'
    add_column :standard_masters, :input_group, :string, limit: 50
    add_check_constraint :standard_masters, "input_type IN ('single', 'multiple')", name: 'standard_master_input_type_valid'
    add_check_constraint :standard_masters, 'usage_place_id IS NULL OR system_key IS NULL', name: 'standard_master_custom_usage_only'
    # 既存の回答テーブルとIDは維持し、顧客専用だった設定だけを共通の使用場所へ移す。
    execute <<~SQL
      UPDATE standard_masters SET
        usage_place_id = CASE WHEN customer_detail_mode <> 'none' THEN
          (SELECT id FROM standard_code_usage_places WHERE key = 'customer_details') END,
        input_type = CASE WHEN customer_detail_mode = 'multiple' OR EXISTS (
          SELECT 1 FROM customer_detail_selections AS answers
          JOIN standard_list_masters AS choices ON choices.id = answers.standard_list_master_id
          WHERE choices.standard_master_id = standard_masters.id
          GROUP BY answers.customer_id HAVING COUNT(*) > 1
        ) THEN 'multiple' ELSE 'single' END,
        input_group = customer_detail_group
    SQL
  end

  def down
    remove_check_constraint :standard_masters, name: 'standard_master_custom_usage_only'
    remove_check_constraint :standard_masters, name: 'standard_master_input_type_valid'
    remove_column :standard_masters, :input_group
    remove_column :standard_masters, :input_type
    remove_reference :standard_masters, :usage_place, foreign_key: { to_table: :standard_code_usage_places }
    drop_table :standard_code_usage_places
  end
end
