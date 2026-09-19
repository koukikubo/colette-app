class AddCompletedAtToReservations < ActiveRecord::Migration[8.1]
  def change
    add_column :reservations, :completed_at, :datetime

    add_index :reservations, :completed_at

    add_check_constraint(
      :reservations,
      "NOT (completed_at IS NOT NULL AND canceled_at IS NOT NULL)",
      name: "check_reservations_not_completed_and_canceled"
    )
  end
end
