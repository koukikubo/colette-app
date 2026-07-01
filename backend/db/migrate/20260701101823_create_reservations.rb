class CreateReservations < ActiveRecord::Migration[8.1]
  def change
    create_table :reservations do |t|
      t.references :customer, null: false, foreign_key: true
      t.datetime :starts_at
      t.datetime :ends_at
      t.integer :guest_count
      t.string :reservation_status_code
      t.string :reservation_route_code
      t.text :memo
      t.datetime :canceled_at
      t.integer :lock_version

      t.timestamps
    end
  end
end
