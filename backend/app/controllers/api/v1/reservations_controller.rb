class Api::V1::ReservationsController < Api::V1::BaseController
  before_action :require_staff_login!, only: %i[create update cancel restore]
  before_action :set_reservation, only: %i[show update cancel restore]

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
        .on_date(target_date)
        .ordered
        .active

    render_success(
      data: {
        reservations: Api::V1::ReservationSerializer.collection(reservations)
      }
    )
  end

  def show
    render_reservation(@reservation)
  end

  def create
    reservation =
      Reservations::CreateService.call(
        attributes: reservation_create_params,
        current_staff: current_staff
      )

    render_reservation(
      reservation,
      status: :created
    )
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

  def cancel
    @reservation.lock_version = required_lock_version

    if @reservation.canceled_at.present?
      return render_error(
        message: "この予約はすでにキャンセル済みです。",
        status: :unprocessable_content
      )
    end

    @reservation.canceled_at = Time.current
    @reservation.updated_by_staff = current_staff

    if @reservation.save
      render_reservation(@reservation)
    else
      render_validation_error(@reservation)
    end
  end

  def restore
    @reservation.lock_version = required_lock_version

    if @reservation.canceled_at.nil?
      return render_error(
        message: "キャンセルされた予約はキャンセルされてません。",
        status: :unprocessable_content
      )
    end

    @reservation.canceled_at = nil
    @reservation.updated_by_staff = current_staff

    # キャンセルから予約リストに戻す際に既存予約が入っていないかチェックするため２重予約されていないか確認。
    Reservations::TableAssignmentValidator.call(
      reservation: @reservation,
      restaurant_master_ids: @reservation.restaurant_master_ids
    )

    if @reservation.save
      render_reservation(@reservation)
    else
      render_validation_error(@reservation)
    end
  end

  private

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
        :canceled_at,
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

  def required_lock_version
    params.require(:reservation).require(:lock_version)
  end
end
