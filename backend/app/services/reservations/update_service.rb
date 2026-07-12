module Reservations
  class UpdateService
    # # Controllerから更新対象の予約・更新値・現在の担当者を受け取り、更新処理を実行する
    def self.call(reservation:, attributes:, current_staff:)
      new(
        reservation: reservation,
        attributes: attributes,
        current_staff: current_staff
      ).call
    end

    # paramsのキーをシンボル化し、Service内で扱いやすい形に整える
    def initialize(reservation:, attributes:, current_staff:)
      @reservation = reservation
      @attributes = attributes.to_h.deep_symbolize_keys
      @current_staff = current_staff
    end
    # 予約本体と実テーブル割当を一連の更新処理として扱い、失敗時は全てロールバックする
    def call
      ActiveRecord::Base.transaction do
        restaurant_master_ids = extract_restaurant_master_ids

        reservation.assign_attributes(reservation_attributes)

        apply_customer_to_reservation
        apply_staff

        Reservations::DoubleBookingValidator.call(
          reservation: reservation,
          restaurant_master_ids: restaurant_master_ids
        )

        reservation.save!

        assign_restaurant_masters!(
          restaurant_master_ids: restaurant_master_ids
        )

        reservation
      end
    end

    private

    attr_reader :reservation, :attributes, :current_staff
    # restaurant_master_ids は中間テーブル用の値なので、予約本体の更新属性から除外する
    def reservation_attributes
      attributes.except(:restaurant_master_ids)
    end
    
    # 実テーブルIDを配列として整形する。未送信と空配列の意味を分けるため、キーがない場合はnilを返す
    def extract_restaurant_master_ids
      return nil unless attributes.key?(:restaurant_master_ids)

      Array(attributes[:restaurant_master_ids])
        .reject(&:blank?)
        .map(&:to_i)
        .uniq
    end

    # 既存顧客が選択されている場合は、顧客マスタの名前を予約名として反映する
    # 電話番号は今回だけ別番号を使う可能性があるため、空の場合のみ顧客マスタから補完する
    def apply_customer_to_reservation
      return if reservation.customer_id.blank?

      customer = Customer.find(reservation.customer_id)

      reservation.customer = customer
      reservation.reservation_name = customer.name

      if reservation.reservation_phone_number.blank?
        reservation.reservation_phone_number = customer.phone_number
      end
    end

    # 更新担当者を現在ログイン中の担当者に更新する
    def apply_staff
      reservation.updated_by_staff = current_staff
    end

    # restaurant_master_ids が送られた場合のみ、中間テーブルの実テーブル割当を更新する
    # nil は変更なし、空配列は割当解除として扱う
    def assign_restaurant_masters!(restaurant_master_ids:)
      return if restaurant_master_ids.nil?

      reservation.restaurant_master_ids = restaurant_master_ids
    end
  end
end