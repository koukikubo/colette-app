class CreateReservationTables < ActiveRecord::Migration[8.1]
  def change
    create_table :reservation_tables do |t|
      t.references :reservation, null: false, foreign_key: true
      t.references :restaurant_master, null: false, foreign_key: true

      t.timestamps
    end
  end
end
