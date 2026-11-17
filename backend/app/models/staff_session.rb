class StaffSession < ApplicationRecord
  belongs_to :staff
  # 最後の操作から4時間で失効する。ログインからの絶対期限とは別に判定する。
  IDLE_TIMEOUT = 4.hours
  ABSOLUTE_TIMEOUT = 12.hours

  def self.issue!(staff)
    token = SecureRandom.hex(32)
    create!(staff: staff, token_digest: Digest::SHA256.hexdigest(token),
            last_seen_at: Time.current, expires_at: ABSOLUTE_TIMEOUT.from_now)
    token
  end

  def self.for_token(token)
    return none if token.blank?
    where(token_digest: Digest::SHA256.hexdigest(token.to_s))
  end

  def expired?
    expires_at <= Time.current || last_seen_at <= IDLE_TIMEOUT.ago
  end
end
