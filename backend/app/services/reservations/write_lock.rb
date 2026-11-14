module Reservations
  module WriteLock
    # 店舗規模の予約書込を直列化する。検証前から割当保存まで保持する。
    # 複数席でも同じキーを使い、ロック順序によるデッドロックを避ける。
    def self.acquire!
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(431902)")
    end
  end
end
