class AddDetailsToReservations < ActiveRecord::Migration[8.1]
  def change
    add_reference :reservations,
                  :customer,
                  foreign_key: true,
                  null: true

    add_column :reservations,
               :reservation_name,
               :string,
               limit: 50,
               null: false

    add_column :reservations,
               :reservation_phone_number,
               :string,
               limit: 20,
               null: false

    add_column :reservations,
               :starts_at,
               :datetime,
               null: false

    add_column :reservations,
               :ends_at,
               :datetime,
               null: false

    add_column :reservations,
               :guest_count,
               :integer,
               null: false

    add_reference :reservations,
                  :requested_restaurant_master_type,
                  null: false,
                  foreign_key: {
                    to_table: :standard_list_masters
                  },
                  index: {
                    name: "idx_reservations_on_requested_table_type_id"
                  }

    add_reference :reservations,
                  :reservation_status,
                  null: false,
                  foreign_key: {
                    to_table: :standard_list_masters
                  }

    add_reference :reservations,
                  :reservation_route,
                  null: true,
                  foreign_key: {
                    to_table: :standard_list_masters
                  }

    add_reference :reservations,
                  :menu_type,
                  null: true,
                  foreign_key: {
                    to_table: :standard_list_masters
                  }

    add_reference :reservations,
                  :occasion,
                  null: true,
                  foreign_key: {
                    to_table: :standard_list_masters
                  }

    add_column :reservations, :allergy_note, :text
    add_column :reservations, :disliked_food_note, :text
    add_column :reservations, :preferred_food_note, :text
    add_column :reservations, :favorite_drink_note, :text
    add_column :reservations, :request_note, :text
    add_column :reservations, :internal_memo, :text

    add_column :reservations, :details_confirmed_at, :datetime
    add_column :reservations, :canceled_at, :datetime

    add_reference :reservations,
                  :created_by_staff,
                  null: false,
                  foreign_key: {
                    to_table: :staffs
                  }

    add_reference :reservations,
                  :updated_by_staff,
                  null: false,
                  foreign_key: {
                    to_table: :staffs
                  }

    add_column :reservations,
               :lock_version,
               :integer,
               default: 0,
               null: false

    add_index :reservations, :starts_at
    add_index :reservations, :canceled_at

    add_check_constraint :reservations,
                         "guest_count > 0",
                         name: "check_reservations_guest_count_positive"

    add_check_constraint :reservations,
                         "ends_at > starts_at",
                         name: "check_reservations_ends_at_after_starts_at"

    add_check_constraint :reservations,
                         "char_length(btrim(reservation_name)) > 0",
                         name: "check_reservations_name_not_blank"

    add_check_constraint :reservations,
                         "char_length(btrim(reservation_phone_number)) > 0",
                         name: "check_reservations_phone_not_blank"

    add_check_constraint :reservations,
                         "lock_version >= 0",
                         name: "check_reservations_lock_version_non_negative"
  end
end