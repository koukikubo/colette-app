class LoginThrottle < ApplicationRecord
  # DB共有の固定窓。IP・アカウントの双方に適用しworker間で制限を共有する。
  def self.allowed?(key, limit:)
    digest = Digest::SHA256.hexdigest(key)
    row = create_or_find_by!(key_digest: digest) do |record|
      record.window_started_at = Time.current
    end
    row.with_lock do
      if row.window_started_at <= 1.minute.ago
        row.update!(window_started_at: Time.current, attempts: 0)
      end
      row.increment!(:attempts)
      row.attempts <= limit
    end
  end
end
