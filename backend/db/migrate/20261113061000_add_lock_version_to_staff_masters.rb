class AddLockVersionToStaffMasters < ActiveRecord::Migration[8.1]
  def change
    add_column :staff_masters, :lock_version, :integer, null: false, default: 0
    add_check_constraint :staff_masters, "lock_version >= 0", name: "staff_masters_lock_version_non_negative"
  end
end
