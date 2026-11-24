module Customers
  module DetailConfigurationLock
    # マスタの有効性・単複選択の検証から回答保存まで、同じ設定を使用する。
    def self.acquire!
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(431905)")
    end
  end
end
