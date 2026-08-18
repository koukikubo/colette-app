module Reservations
  # 指定時間帯と重複する予約が使用している実テーブルIDを取得する。
  # 登録・更新時の重複チェックと空き状況APIで、同じ判定条件を使うために共通化している。
  class UnavailableRestaurantMasterIdsQuery
    def self.call(
      starts_at:,
      ends_at:,
      excluded_reservation_id: nil,
      restaurant_master_ids: nil
    )
      new(
        starts_at: starts_at,
        ends_at: ends_at,
        excluded_reservation_id: excluded_reservation_id,
        restaurant_master_ids: restaurant_master_ids
      ).call
    end
    # 検索条件をインスタンス変数に保存する。
    def initialize(
      starts_at:,
      ends_at:,
      excluded_reservation_id: nil,
      restaurant_master_ids: nil
    )
      @starts_at = starts_at
      @ends_at = ends_at
      @excluded_reservation_id = excluded_reservation_id

      # 席IDを整数に変換し、重複を取り除く。nilの場合はnilのままにする。
      @restaurant_master_ids =
        restaurant_master_ids&.map(&:to_i)&.uniq
    end

    # 検索条件を組み立て、使用できない席IDを配列で返す。
    def call
      # 最初に「時間が重複している有効な予約席」を取得する。
      scope = overlapping_reservation_tables

      # nilは全テーブルを検索し、空配列は検索対象なしとして区別する。
      unless restaurant_master_ids.nil?
        scope =
          scope.where(
            restaurant_master_id: restaurant_master_ids
          )
      end

      # 予約更新時は、更新対象の予約自身を検索結果から除外する。
      if excluded_reservation_id.present?
        scope =
          scope.where.not(
            reservation_id: excluded_reservation_id
          )
      end

      # 重複する席IDを、重複なし・昇順の配列として返す。
      scope
        .distinct
        .order(:restaurant_master_id)
        .pluck(:restaurant_master_id)
    end

    private

    # インスタンス変数を読み取るためのprivateメソッドを定義する。
    attr_reader(
      :starts_at,
      :ends_at,
      :excluded_reservation_id,
      :restaurant_master_ids
    )

    # キャンセルされておらず、指定時間帯と重複する予約席を取得する。
    # 終了時刻と開始時刻が一致する連続予約は、時間重複として扱わない。
    def overlapping_reservation_tables
      ReservationTable
        .joins(:reservation)
        .where(reservations: { canceled_at: nil })
        .where(
          "reservations.starts_at < :ends_at " \
          "AND reservations.ends_at > :starts_at",
          starts_at: starts_at,
          ends_at: ends_at
        )
    end
  end
end
