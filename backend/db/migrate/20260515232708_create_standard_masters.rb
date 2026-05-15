class CreateStandardMasters < ActiveRecord::Migration[8.1]
  def change
    create_table :standard_masters do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.text :description
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :standard_masters, :code, unique: true
    add_index :standard_masters, :name
    add_index :standard_masters, :active
    add_index :standard_masters, :position
  end
end
