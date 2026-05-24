class CreateStaffs < ActiveRecord::Migration[8.1]
  def change
    create_table :staffs do |t|
      t.references :staff_master, null: false, foreign_key: true, index: { unique: true }
      t.string :password_digest, null: false
      t.boolean :login_enabled, null: false, default: true
      t.integer :failed_attempts, null: false, default: 0
      t.datetime :last_logged_in_at

      t.timestamps

    end

    add_check_constraint :staffs,
                          "failed_attempts >= 0",
                          name: "check_staffs_failed_attempts_non_negative"

  end
end
