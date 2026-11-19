# 来店結果の監査と、応答喪失後の再送照合を同じ確定記録で扱う。
class ReservationResultChange < ApplicationRecord
  belongs_to :reservation
  belongs_to :staff
  validates :operation, :key_digest, :request_digest, presence: true
  validates :reason, length: { maximum: 1000 }
end
