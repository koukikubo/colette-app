class CreateCustomerCreationRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_creation_requests do |t|
      t.references :staff, null: false, foreign_key: { to_table: :staffs }
      t.references :customer, null: false, foreign_key: true
      t.string :key_digest, null: false
      t.string :request_digest, null: false
      t.timestamps
    end
    add_index :customer_creation_requests, [ :staff_id, :key_digest ], unique: true
  end
end
