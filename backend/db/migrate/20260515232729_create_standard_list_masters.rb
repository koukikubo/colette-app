class CreateStandardListMasters < ActiveRecord::Migration[8.1]
  def change
  create_table :standard_list_masters do |t|
    t.references :standard_master, null: false, foreign_key: true
    t.string :code, null: false
    t.string :label, null: false
    t.text :description
    t.boolean :active, null: false, default: true
    t.integer :position, null: false, default: 0

    t.timestamps
  end

  add_index :standard_list_masters,
            [:standard_master_id, :code],
            unique: true,
            name: "index_standard_list_masters_on_master_id_and_code"
  add_index :standard_list_masters, :active
  
  add_index :standard_list_masters, 
            [:standard_master_id, :position],
            unique: true,
            name: "index_standard_list_masters_on_master_id_and_position"
  end
end
