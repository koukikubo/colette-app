class CustomerDetailSelection < ApplicationRecord
  belongs_to :customer
  belongs_to :standard_list_master
  validates :standard_list_master_id, uniqueness: { scope: :customer_id }
end
