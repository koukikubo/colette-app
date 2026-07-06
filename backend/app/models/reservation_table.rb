class ReservationTable < ApplicationRecord
  belongs_to :reservation
  belongs_to :restaurant_master

  # 同じ席を重複させないためのバリデーション
  validates :restaurant_master_id,
            uniqueness: {
              scope: :reservation_id
            }
end
