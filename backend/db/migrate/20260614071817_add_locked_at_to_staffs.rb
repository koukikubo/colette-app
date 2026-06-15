class AddLockedAtToStaffs < ActiveRecord::Migration[8.1]
  def change
    add_column :staffs, :locked_at, :datetime
    add_index :staffs, :locked_at
  end
end
