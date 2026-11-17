module Rf
  module ConfigurationLock
    # ルール公開・適用とマスタ停止を同じ順序で検証し、検証後のすれ違いを防ぐ。
    def self.acquire!
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(431904)")
    end

    def self.synchronize
      ActiveRecord::Base.transaction do
        acquire!
        yield
      end
    end
  end
end
