class CreateStaffGuideStates < ActiveRecord::Migration[8.1]
  def change
    # 認証情報と分け、同じ担当者の案内状態だけを端末間で共有する。
    create_table :staff_guide_states do |t|
      t.references :staff, null: false, foreign_key: true
      t.integer :guide_version, null: false
      t.string :status, null: false
      t.timestamps
    end
    add_index :staff_guide_states, [ :staff_id, :guide_version ], unique: true
    add_check_constraint :staff_guide_states, "guide_version > 0", name: "staff_guide_version_positive"
    add_check_constraint :staff_guide_states, "status IN ('completed', 'skipped')", name: "staff_guide_status_valid"
  end
end
