class Api::V1::ReservationsController < Api::V1::BaseController
  include ApiPagination
  # 同一顧客の有効な予約時間が重複した場合に発生する。
  CUSTOMER_OVERLAP_CONSTRAINT_NAME =
    "exclude_active_customer_reservation_overlaps".freeze

  CUSTOMER_OVERLAP_ERROR_CODE =
    "customer_reservation_overlap".freeze

  # DB排他制約違反を確認し顧客予約の時間重複としてAPIレスポンスへ変換する。
  rescue_from ActiveRecord::ExclusionViolation,
              with: :render_customer_overlap_exclusion_error

  before_action :set_reservation, only: %i[show update cancel restore complete reopen no_show correct_result result_changes confirm_details]

  RESERVATION_BASE_ATTRIBUTES = %i[
  customer_id
  reservation_name
  reservation_phone_number
  reservation_status_id
  starts_at
  ends_at
  guest_count
  requested_restaurant_master_type_id
  reservation_route_id
  menu_type_id
  occasion_id
  allergy_note
  disliked_food_note
  preferred_food_note
  favorite_drink_note
  request_note
  internal_memo
].freeze

  def index
    target_date = target_reservation_date

    reservations =
      Reservation
        .includes(
          :customer,
          :requested_restaurant_master_type,
          :reservation_status,
          :reservation_route,
          :menu_type,
          :occasion,
          :restaurant_masters,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .ordered
    # 未処理も日付指定時は表示日に限定し、日付なしの全期間取得は明示操作で使う。
    reservations = reservations.on_date(target_date) if params[:state] != "pending_checkout" || params[:date].present?

    reservations =
      apply_reservation_state_filter(reservations)

    data = {}
    if params[:state] == "pending_checkout"
      pagination = pagination_params
      return unless pagination
      result = paginate(reservations, **pagination)
      reservations = result[:records]
      data[:pagination] = result[:metadata]
    end
    data[:reservations] = Api::V1::ReservationSerializer.collection(reservations)
    render_success(data: data)
  end

  def show
    render_reservation(@reservation)
  end

  # 監査は追記のみとし、閲覧時は担当者と変更前後をページ単位で返す。
  def result_changes
    pagination = pagination_params
    return unless pagination
    records = paginate(@reservation.reservation_result_changes.includes(staff: :staff_master).order(id: :desc), **pagination)
    render_success(data: { changes: records[:records].map { |event|
      { id: event.id, operation: event.operation, reason: event.reason, created_at: event.created_at,
        staff_name: event.staff.staff_master.name, before_state: event.before_state, after_state: event.after_state }
    }, pagination: records[:metadata] })
  end

  def create
    reservation =
      Reservations::IdempotentCreator.call(
        attributes: reservation_create_params,
        current_staff: current_staff,
        key: request.headers["Idempotency-Key"]
      )

    render_reservation(
      reservation,
      status: :created
    )
  rescue Reservations::IdempotentCreator::ConflictingRequestError => error
    render_error(message: error.message, status: :conflict, code: "idempotency_conflict")
  end

  def update
    reservation =
      Reservations::UpdateService.call(
        reservation: @reservation,
        attributes: reservation_update_params,
        current_staff: current_staff
      )

    render_reservation(reservation)
  end

  # 確認済み時刻はクライアント時計に依存させず、確認した版と担当者を記録する。
  def confirm_details
    @reservation.lock_version = required_lock_version
    if @reservation.canceled_at || @reservation.completed_at
      return render_error(message: "未完了の有効予約だけを確認済みにできます", status: :unprocessable_content)
    end
    @reservation.update!(details_confirmed_at: Time.current, updated_by_staff: current_staff)
    render_reservation(@reservation)
  end

  # 旧APIも来店結果サービスへ委譲し、監査・競合検知を迂回させない。
  %w[complete reopen cancel restore no_show correct_result].each do |operation|
    define_method(operation) { change_visit_result(operation) }
  end

  private

  # DBの排他制約が検出した同一顧客の時間重複を、フォームで表示できるバリデーションエラーへ変換する。
  def render_customer_overlap_exclusion_error(error)
    constraint_name =
      error.cause
        &.result
        &.error_field(PG::Result::PG_DIAG_CONSTRAINT_NAME)

    # 想定した制約以外のDBエラーは握りつぶさない。
    raise error unless constraint_name == CUSTOMER_OVERLAP_CONSTRAINT_NAME

    reservation = Reservation.new
    reservation.errors.add(:customer_id, :overlapping_reservation)

    render_validation_error(reservation, code: CUSTOMER_OVERLAP_ERROR_CODE)
  end

  def set_reservation
    @reservation =
      Reservation
        .includes(
          :customer,
          :requested_restaurant_master_type,
          :reservation_status,
          :reservation_route,
          :menu_type,
          :occasion,
          :restaurant_masters,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .find(params[:id])
  end

  def target_reservation_date
    return Time.zone.today if params[:date].blank?

    Date.iso8601(params[:date])
  rescue Date::Error
    raise ActionController::BadRequest, "dateはYYYY-MM-DD形式で指定してください"
  end

  def reservation_create_params
    params.require(:reservation).permit(
      *RESERVATION_BASE_ATTRIBUTES,
      restaurant_master_ids: []
    )
  end

  def reservation_update_params
    permitted_params =
      params.require(:reservation).permit(
        *RESERVATION_BASE_ATTRIBUTES,
        :reservation_status_id,
        :details_confirmed_at,
        :lock_version,
        restaurant_master_ids: []
      )


    if permitted_params[:lock_version].nil?
      raise ActionController::ParameterMissing.new(
        :lock_version
      )
    end

    permitted_params
  end

  def render_reservation(reservation, status: :ok)
    render_success(
      data: {
        reservation: Api::V1::ReservationSerializer
        .new(reservation)
        .as_json
      },
      status: status
    )
  end

  def change_visit_result(operation)
    attributes = params.require(:reservation).permit(:lock_version, :visit_result, :reason, :confirm_tentative,
      booking: %i[customer_id starts_at ends_at guest_count reservation_status_id])
    reservation = Reservations::ResultChanger.call(reservation: @reservation, attributes: attributes,
      current_staff: current_staff, key: request.headers["Idempotency-Key"], operation: operation)
    render_reservation(reservation)
  rescue ActiveRecord::StaleObjectError
    # 結果更新は保存済みキーを先に照合するため、この拒否なら同じ操作の未保存が確定する。
    render_error(message: "予約は別の担当者によって更新されています。最新情報を取得して選び直してください",
      status: :conflict, code: "reservation_result_conflict")
  rescue Reservations::ResultChanger::ConflictingRequestError => error
    render_error(message: error.message, status: :conflict, code: "idempotency_conflict")
  end

  def required_lock_version
    params.require(:reservation).require(:lock_version)
  end

  def apply_reservation_state_filter(reservations)
    state = params[:state]

    return reservations.active if state.blank? || state == "active"
    return reservations.canceled if state == "canceled"
    # 過去の未退店を日付選択だけに埋もれさせず、予約管理内で手動確認する。
    return reservations.active.where(completed_at: nil).where("ends_at <= ?", Time.current) if state == "pending_checkout"

    raise ActionController::BadRequest,
          "stateはactive、canceled、pending_checkoutを指定してください"
  end
end
