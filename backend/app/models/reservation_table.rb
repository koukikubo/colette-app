class ReservationTable < ApplicationRecord
  belongs_to :reservation
  belongs_to :restaurant_master
end
