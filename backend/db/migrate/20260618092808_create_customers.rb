class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|

      t.string :customer_kind,
                null: false,
                default: "individual",
                limit: 30
      t.string :name,
                null: false,
                limit: 30
      t.string :kana,
                null: false,
                limit: 30
      t.string :postal_code,
                limit: 7
      t.string :address,
                limit: 255
      t.string :phone_number,
                limit: 20
      t.string :email,
                limit: 255
      t.date :birthday
      t.string :company_name,
                limit: 100
      t.string :company_name_kana,
                limit: 100
      t.string :company_postal_code,
                limit: 7
      t.string :company_address,
                limit: 255
      t.string :company_phone_number,
                limit: 20
      t.string :company_email,
                limit: 255
      t.text :memo
      t.datetime :hidden_at
      t.references :created_by_staff,
                    null: false,
                    foreign_key: { to_table: :staffs }
      t.references :updated_by_staff,
                    null: false,
                    foreign_key: { to_table: :staffs }

      t.timestamps
    end

    add_index :customers, :customer_kind

    add_index :customers, :name
    add_index :customers, :kana

    add_index :customers, :phone_number
    add_index :customers, :company_phone_number

    add_index :customers, :company_name
    add_index :customers, :company_name_kana

    add_index :customers,
              [:hidden_at, :id],
              name: "index_customers_on_hidden_at_and_id"
  end
end