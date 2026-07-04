class CreateReservationTables < ActiveRecord::Migration[8.1]
  def change
    create_table :reservation_tables do |t|
      t.timestamps
    end
  end
end
