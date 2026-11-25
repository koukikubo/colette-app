module StandardCodes
  module ConfigurationLock
    # 使用場所・単複選択・全体件数の確認から回答保存まで、同じ設定を使用する。
    def self.acquire!
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(431905)")
    end
  end
end
