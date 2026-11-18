require "digest"

module Reservations
  class IdempotentCreator
    class ConflictingRequestError < StandardError; end

    def self.call(attributes:, current_staff:, key:)
      key_digest = CreationRequestKey.digest(key)

      # 許可済みの入力だけを順序に依存しない形で照合する。個人情報を別途保存しない。
      request_digest = Digest::SHA256.hexdigest(attributes.to_h.deep_stringify_keys.sort.to_h.to_json)

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
    # 書き込みは再送せず、同じ担当者の確定済み結果だけを返す。
    def self.find_result(current_staff:, key:)
      key_digest = CreationRequestKey.digest(key)
      Reservation.transaction do
        WriteLock.acquire!
        ReservationCreationRequest.find_by(staff: current_staff, key_digest: key_digest)&.reservation
      end
    end
  end
end
