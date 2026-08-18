class Api::V1::RestaurantMasterAvailabilitiesController <
      Api::V1::BaseController
  before_action :require_staff_login!

  rescue_from ArgumentError,
              with: :render_invalid_datetime

  def index
    starts_at = parse_datetime_param(:starts_at)
    ends_at = parse_datetime_param(:ends_at)

    if ends_at <= starts_at
      return render_error(
        message: "終了日時は開始日時より後に指定してください",
        status: :bad_request
      )
    end

    unavailable_restaurant_master_ids =
      Reservations::UnavailableRestaurantMasterIdsQuery.call(
        starts_at: starts_at,
        ends_at: ends_at,
        excluded_reservation_id: excluded_reservation_id
      )

    render_success(
      data: {
        unavailable_restaurant_master_ids:
          unavailable_restaurant_master_ids
      }
    )
  end

  private

  # APIで受け取ったISO 8601形式の日時を、Railsのタイムゾーンで解釈する。
  def parse_datetime_param(name)
    Time.zone.iso8601(params.require(name))
  end

  # 編集時だけ対象予約を重複判定から除外する。
  # 新規登録ではreservation_idが送られないためnilを返す。
  def excluded_reservation_id
    value = params[:reservation_id].presence

    return if value.nil?

    Integer(value, 10)
  end

  def render_invalid_datetime(error)
    render_error(
      message: "日時の形式が正しくありません",
      errors: [ error.message ],
      status: :bad_request
    )
  end
end
