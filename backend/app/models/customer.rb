class Customer < ApplicationRecord
  belongs_to :created_by_staff,
              class_name: "Staff",
              foreign_key: :created_by_staff_id,
              inverse_of: :created_customers

  belongs_to :updated_by_staff,
              class_name: "Staff",
              foreign_key: :updated_by_staff_id,
              inverse_of: :updated_customers
end
