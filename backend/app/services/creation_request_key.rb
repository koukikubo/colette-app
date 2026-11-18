require "digest"

# 送信キーは認証の代替にしない。担当者ごとの再送識別にだけ使用する。
module CreationRequestKey
  def self.digest(key)
    unless key.is_a?(String) && key.match?(/\A[a-zA-Z0-9_-]{16,128}\z/)
      raise ActionController::BadRequest, "Idempotency-Keyには16〜128文字の英数字・ハイフン・アンダースコアを指定してください"
    end
    Digest::SHA256.hexdigest(key)
  end
end
