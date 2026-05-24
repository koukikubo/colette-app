class CreateStaffMasters < ActiveRecord::Migration[8.1]
  def change
    create_table :staff_masters do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.string :role_code, null: false
      t.date :employment_started_on, null: false
      t.date :retired_on
      t.text :memo

      t.timestamps

    end
    # コードは一意である必要があるため、ユニークインデックスを追加
    add_index :staff_masters, :code, unique: true
    
    add_index :staff_masters, :role_code
    add_index :staff_masters, :retired_on
  end
end
