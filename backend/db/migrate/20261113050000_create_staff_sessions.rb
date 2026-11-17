class CreateStaffSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :staff_sessions do |t|
      t.references :staff, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :last_seen_at, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :staff_sessions, :token_digest, unique: true
    create_table :login_throttles do |t|
      t.string :key_digest, null: false
      t.datetime :window_started_at, null: false
      t.integer :attempts, null: false, default: 0
    end
    add_index :login_throttles, :key_digest, unique: true
  end
end
