class CustomerCreationRequest < ApplicationRecord
  belongs_to :staff
  belongs_to :customer
end
