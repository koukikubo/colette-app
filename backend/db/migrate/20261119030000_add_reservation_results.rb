class AddReservationResults < ActiveRecord::Migration[8.1]
  def up
    add_column :reservations, :cancellation_kind, :string
    # 過去の取消が通常／無断だったかは推測せず、種別不明として日時を保持する。
    execute "UPDATE reservations SET cancellation_kind = 'unknown' WHERE canceled_at IS NOT NULL"
    add_check_constraint :reservations,
      "(canceled_at IS NULL AND cancellation_kind IS NULL) OR (canceled_at IS NOT NULL AND cancellation_kind IS NOT NULL AND cancellation_kind IN ('regular', 'no_show', 'unknown'))",
      name: "reservation_cancellation_kind_consistent"

    create_table :reservation_result_changes do |t|
      t.references :reservation, null: false, foreign_key: true
      t.references :staff, null: false, foreign_key: true
      t.string :operation, null: false
      t.string :key_digest, null: false
      t.string :request_digest, null: false
      t.string :reason, limit: 1000
      t.jsonb :before_state, null: false
      t.jsonb :after_state, null: false
      t.datetime :created_at, null: false
    end
    add_index :reservation_result_changes, %i[staff_id key_digest], unique: true
  end

  def down
    drop_table :reservation_result_changes
    remove_check_constraint :reservations, name: "reservation_cancellation_kind_consistent"
    remove_column :reservations, :cancellation_kind
  end
end
