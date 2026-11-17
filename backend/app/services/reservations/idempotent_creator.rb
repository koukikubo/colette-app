require "digest"

module Reservations
  class IdempotentCreator
    class ConflictingRequestError < StandardError; end

    def self.call(attributes:, current_staff:, key:)
      unless key.is_a?(String) && key.match?(/\A[a-zA-Z0-9_-]{16,128}\z/)
        raise ActionController::BadRequest, "Idempotency-Keyには16〜128文字の英数字・ハイフン・アンダースコアを指定してください"
      end

      # 許可済みの入力だけを順序に依存しない形で照合する。個人情報を別途保存しない。
      request_digest = Digest::SHA256.hexdigest(attributes.to_h.deep_stringify_keys.sort.to_h.to_json)
      key_digest = Digest::SHA256.hexdigest(key)

      Reservation.transaction do
        # 同一キーの同時再送も、予約本体の保存と一体で扱う。
        WriteLock.acquire!
        previous = ReservationCreationRequest.find_by(staff: current_staff, key_digest: key_digest)
        if previous
          unless previous.request_digest == request_digest
            raise ConflictingRequestError, "同じ送信キーで内容が異なります。前回の予約を確認してください"
          end
          next previous.reservation
        end

        reservation = CreateService.call(attributes: attributes, current_staff: current_staff)
        ReservationCreationRequest.create!(staff: current_staff, reservation: reservation,
                                           key_digest: key_digest, request_digest: request_digest)
        reservation
      end
    end
  end
end
