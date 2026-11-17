class ReservationCreationRequest < ApplicationRecord
  belongs_to :staff
  belongs_to :reservation
end
