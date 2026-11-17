module Customers
  class IdempotentCreator
    class ConflictingRequestError < StandardError; end

    def self.call(attributes:, current_staff:, key:)
      key_digest = CreationRequestKey.digest(key)
      request_digest = Digest::SHA256.hexdigest(attributes.to_h.deep_stringify_keys.sort.to_h.to_json)
      Customer.transaction do
        lock!
        previous = CustomerCreationRequest.find_by(staff: current_staff, key_digest: key_digest)
        if previous
          unless previous.request_digest == request_digest
            raise ConflictingRequestError, "前回と入力内容が異なります。登録結果を確認してください"
          end
          next previous.customer
        end
        customer = Customer.create!(attributes.merge(created_by_staff: current_staff, updated_by_staff: current_staff))
        # 顧客と再送履歴を同じtransactionで確定し、個人情報のコピーは履歴へ保存しない。
        CustomerCreationRequest.create!(staff: current_staff, customer: customer,
                                        key_digest: key_digest, request_digest: request_digest)
        customer
      end
    end

    def self.find_result(current_staff:, key:)
      key_digest = CreationRequestKey.digest(key)
      Customer.transaction do
        lock!
        CustomerCreationRequest.find_by(staff: current_staff, key_digest: key_digest)&.customer
      end
    end

    def self.lock!
      # 作成と結果確認を同じDBロックで直列化する。予約の席ロックとは分離する。
      Customer.connection.execute("SELECT pg_advisory_xact_lock(431903)")
    end
    private_class_method :lock!
  end
end
