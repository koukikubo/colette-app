module Reservations
  # 予約へ実テーブルを割り当てる際に、席マスタの状態や予約状況を検証する。
  # 複数の登録・更新処理で同じ割り当てルールを適用するため、Serviceとして共通化している。
  class TableAssignmentValidator
    # reservation: Reservationオブジェクト
    def self.call(reservation:, restaurant_master_ids:, existing_restaurant_master_ids: [])
      new(
        reservation: reservation,
        restaurant_master_ids: restaurant_master_ids,
        existing_restaurant_master_ids: existing_restaurant_master_ids
      ).call
    end
    # restaurant_master_idsから来た値を整理するために、initializeで配列化・空白除去・整数化・重複除去を行う
    def initialize(reservation:, restaurant_master_ids:, existing_restaurant_master_ids: [])
      @reservation = reservation
      @restaurant_master_ids = normalize_ids(restaurant_master_ids)
      @existing_restaurant_master_ids =
        normalize_ids(existing_restaurant_master_ids)
    end

    def call
      # restaurant_master_idsが空の場合はバリデーションをスキップ
      return if restaurant_master_ids.blank?

      validate_restaurant_masters_exist!
      validate_restaurant_masters_active!
      validate_total_capacity!
      validate_no_double_booking!
    end

    private

    # paramsとDBの関連IDを同じ形式で比較できるように、整数の重複なし配列へ統一する。
    def normalize_ids(ids)
      Array(ids)
        .reject(&:blank?)
        .map(&:to_i)
        .uniq
    end

    attr_reader :reservation, :restaurant_master_ids, :existing_restaurant_master_ids
    # restaurant_master_idsに存在しないIDが含まれていないかを検証する
    def validate_restaurant_masters_exist!
      found_count =
        RestaurantMaster
          .where(id: restaurant_master_ids)
          .count

      return if found_count == restaurant_master_ids.size

      raise ActiveRecord::RecordNotFound,
            "存在しない予約席が含まれています"
    end
    # restaurant_master_idsに無効な席が含まれていないかを検証する
    def validate_restaurant_masters_active!
      newly_assigned_ids =
        restaurant_master_ids - existing_restaurant_master_ids

      return if newly_assigned_ids.blank?

      inactive_exists =
        RestaurantMaster
          .where(id: newly_assigned_ids)
          .where(active: false)
          .exists?

      return unless inactive_exists

      raise ActiveRecord::RecordInvalid,
            Reservation.new.tap { |r| r.errors.add(:base, "無効な予約席が含まれています") }
    end

    # テーブルを割り当てる場合は、選択した全テーブルの合計定員が予約人数を満たすことを検証する。
    # テーブル未割り当ての予約はcallの先頭で除外されるため、登録・更新を許可する。
    def validate_total_capacity!
      return if reservation.guest_count.blank?

      total_capacity =
        RestaurantMaster
          .where(id: restaurant_master_ids)
          .sum(:capacity)

      return if total_capacity >= reservation.guest_count

      invalid_reservation =
        Reservation.new.tap do |record|
          record.errors.add(
            :restaurant_master_ids,
            :insufficient_capacity
          )
        end

      raise ActiveRecord::RecordInvalid, invalid_reservation
    end

    # 重複している席が見つかった場合は、エラー情報を持つ Reservation を作成してActiveRecord::RecordInvalid を発生させる。
    def validate_no_double_booking!
      return if reservation.starts_at.blank? || reservation.ends_at.blank?
      # 指定された時間帯に使用できない席のIDを取得する。
      unavailable_restaurant_master_ids =
          Reservations::UnavailableRestaurantMasterIdsQuery.call(
            starts_at: reservation.starts_at,
            ends_at: reservation.ends_at,
            # 予約更新時は、自分自身の予約を重複判定から除外する。
            excluded_reservation_id: excluded_reservation_id,
            # 今回選択された席だけを重複確認の対象にする。
            restaurant_master_ids: restaurant_master_ids
          )
      # 使用できない席がなければ、重複していないので正常終了する。
      return if unavailable_restaurant_master_ids.empty?

      # 重複を表すエラー情報を持ったReservationオブジェクトを作成し、
      # ActiveRecord::RecordInvalidを発生させる。
      raise ActiveRecord::RecordInvalid,
            Reservation.new.tap { |r| r.errors.add(:base, "指定された席は同じ時間帯に予約済みです") }
    end

    # 編集・復元時は、自分自身のテーブル割り当てを重複予約として扱わない。
    def excluded_reservation_id
      return if reservation.new_record?

      reservation.id
    end
  end
end
