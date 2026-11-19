require "digest"

module Reservations
  # 退店・取消・訂正を共通の排他境界で保存し、監査と再送受付を原子的に確定する。
  class ResultChanger
    class ConflictingRequestError < StandardError; end
    RESULTS = %w[pending checked_out canceled no_show].freeze
    SNAPSHOT_FIELDS = %w[customer_id reservation_status_id starts_at ends_at guest_count completed_at canceled_at cancellation_kind lock_version].freeze

    def self.call(reservation:, attributes:, current_staff:, key:, operation:)
      new(reservation, attributes, current_staff, key, operation).call
    end

    def initialize(reservation, attributes, staff, key, operation)
      @reservation, @staff, @key, @operation = reservation, staff, key, operation
      @attributes = attributes.to_h.deep_symbolize_keys
    end

    def call
      unless @key.is_a?(String) && @key.match?(/\A[a-zA-Z0-9_-]{16,128}\z/)
        raise ActionController::BadRequest, "有効なIdempotency-Keyが必要です"
      end
      key_digest = Digest::SHA256.hexdigest(@key)
      digest = Digest::SHA256.hexdigest({ id: @reservation.id, operation: @operation, attributes: canonical(@attributes) }.to_json)
      Reservation.transaction do
        WriteLock.acquire!
        previous = ReservationResultChange.find_by(staff: @staff, key_digest: key_digest)
        if previous
          raise ConflictingRequestError, "同じ送信キーで操作内容が異なります" unless previous.request_digest == digest
          # 再送の照合は版の検証より先に行う。後続編集があれば現在の予約を返す。
          next @reservation.reload
        end
        @reservation.lock!
        version = @attributes[:lock_version]
        raise ActionController::ParameterMissing, :lock_version if version.nil?
        unless version.to_s.match?(/\A\d+\z/) && version.to_i == @reservation.lock_version
          raise ActiveRecord::StaleObjectError.new(@reservation, "update")
        end
        before = snapshot
        apply_result!
        @reservation.updated_by_staff = @staff
        @reservation.save!
        ReservationResultChange.create!(reservation: @reservation, staff: @staff, operation: @operation,
          reason: @attributes[:reason].presence, key_digest: key_digest, request_digest: digest,
          before_state: before, after_state: snapshot)
        @reservation
      end
    end

    private

    # キー順序や入れ子の順序ではなく、許可済みの入力内容で同じ操作かを判定する。
    def canonical(value)
      case value
      when Hash then value.transform_keys(&:to_s).sort.to_h.transform_values { |item| canonical(item) }
      when Array then value.map { |item| canonical(item) }
      else value
      end
    end

    def snapshot
      @reservation.attributes.slice(*SNAPSHOT_FIELDS).merge("restaurant_master_ids" => @reservation.restaurant_master_ids.sort)
    end

    def invalid!(message)
      @reservation.errors.add(:base, message)
      raise ActiveRecord::RecordInvalid, @reservation
    end

    # 旧エンドポイントにも同じ状態検証・理由・監査を適用して迂回経路を作らない。
    def apply_result!
      current = @reservation.visit_result
      target = case @operation
      when "complete"
        invalid!("未処理の予約だけを退店済みにできます") unless current == "pending"
        "checked_out"
      when "cancel", "no_show"
        invalid!("処理済みの予約は「来店結果を訂正」から変更してください") unless current == "pending"
        @operation == "cancel" ? "canceled" : "no_show"
      when "reopen"
        invalid!("退店済みではありません") unless current == "checked_out"
        "pending"
      when "restore"
        invalid!("キャンセル済みではありません") unless @reservation.canceled_at
        "pending"
      when "correct_result"
        @attributes[:visit_result]
      end
      invalid!("来店結果が不正です") unless RESULTS.include?(target)
      correction = %w[correct_result reopen restore].include?(@operation)
      if correction && current != "no_show" && target != "no_show" && @attributes[:reason].to_s.strip.empty?
        invalid!("訂正理由を入力してください")
      end
      invalid!("変更後の来店結果を選択してください") if target == current && @attributes[:booking].blank?
      if @attributes[:reason].to_s.length > 1000
        invalid!("訂正理由は1000文字以内で入力してください")
      end
      # 顧客・日時の訂正も同じトランザクションで検証し、監査の前後へ含める。
      if @operation == "correct_result" && @attributes[:booking].present?
        @reservation.assign_attributes(@attributes[:booking])
        if @attributes[:booking].key?(:customer_id) && @reservation.customer_id
          @reservation.customer = Customer.find(@reservation.customer_id)
          @reservation.reservation_name = @reservation.customer.name
        end
        @reservation.details_confirmed_at = nil
      end
      invalid!("予約開始日時を指定してください") if @reservation.starts_at.nil?
      if %w[checked_out no_show].include?(target) && @reservation.starts_at > Time.current
        invalid!("予約開始時刻以降に操作してください")
      end
      confirm_acceptance! if target == "checked_out"
      @reservation.completed_at = target == "checked_out" ? (@reservation.completed_at || Time.current) : nil
      @reservation.canceled_at = %w[canceled no_show].include?(target) ? (@reservation.canceled_at || Time.current) : nil
      @reservation.cancellation_kind = { "canceled" => "regular", "no_show" => "no_show" }[target]
      # 取消から戻す際は席の競合と有効性を再検証する。通常の退店で予定枠は変更しない。
      if @reservation.canceled_at.nil? && (current != "pending" || @attributes[:booking].present?)
        TableAssignmentValidator.call(reservation: @reservation, restaurant_master_ids: @reservation.restaurant_master_ids,
          existing_restaurant_master_ids: current == "checked_out" ? @reservation.restaurant_master_ids : [])
      end
    end

    # 仮予約の退店は、画面で明示確認した場合だけ受付確定と一体で保存する。
    def confirm_acceptance!
      status = @reservation.reservation_status
      return if status.code == "confirmed"
      invalid!("予約確定と退店の同時処理を確認してください") unless status.code == "tentative" && @attributes[:confirm_tentative] == true
      confirmed = StandardListMaster.joins(:standard_master).where(active: true, code: "confirmed",
        standard_masters: { system_key: "reservation_status", active: true }).to_a
      invalid!("有効な予約確定コードを1件設定してください") unless confirmed.one?
      @reservation.reservation_status = confirmed.first
    end
  end
end
