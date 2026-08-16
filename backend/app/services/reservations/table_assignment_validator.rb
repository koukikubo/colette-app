module Reservations
  # 予約へ実テーブルを割り当てる際に、席マスタの状態や予約状況を検証する。
  # 複数の登録・更新処理で同じ割り当てルールを適用するため、Serviceとして共通化している。
  class TableAssignmentValidator
    # reservation: Reservationオブジェクト
    def self.call(reservation:, restaurant_master_ids:)
      new(
        reservation: reservation,
        restaurant_master_ids: restaurant_master_ids
      ).call
    end
    # restaurant_master_idsから来た値を整理するために、initializeで配列化・空白除去・整数化・重複除去を行う
    def initialize(reservation:, restaurant_master_ids:)
      @reservation = reservation
      @restaurant_master_ids =
        Array(restaurant_master_ids)
          .reject(&:blank?)
          .map(&:to_i)
          .uniq
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

    attr_reader :reservation, :restaurant_master_ids
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
      inactive_exists =
        RestaurantMaster
          .where(id: restaurant_master_ids)
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

    # restaurant_master_idsに重複予約がないかを検証する
    def validate_no_double_booking!
      return if reservation.starts_at.blank? || reservation.ends_at.blank?

      duplicated_exists =
        double_booking_scope
          .where(
            "reservations.starts_at < :ends_at AND reservations.ends_at > :starts_at",
            starts_at: reservation.starts_at,
            ends_at: reservation.ends_at
          )
          .exists?

      return unless duplicated_exists

      raise ActiveRecord::RecordInvalid,
            Reservation.new.tap { |r| r.errors.add(:base, "指定された席は同じ時間帯に予約済みです") }
    end
    # reservationとrestaurant_master_idsに基づいて、重複予約の可能性があるReservationのスコープを返す
    def double_booking_scope
      scope =
        Reservation
          .joins(:reservation_tables)
          .where(
            reservation_tables: {
              restaurant_master_id: restaurant_master_ids
            }
          )
          .where(canceled_at: nil)
      # reservationが新規作成の場合は、全ての既存予約を対象とする
      return scope if reservation.new_record?
      # reservationが既存の予約の場合は、自身を除外する
      scope.where.not(reservations: { id: reservation.id })
    end
  end
end
