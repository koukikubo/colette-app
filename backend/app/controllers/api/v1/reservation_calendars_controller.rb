class Api::V1::ReservationCalendarsController < Api::V1::BaseController
  def show
    render_success(data: Reservations::CalendarSummary.call(month: params[:month] || Date.current.strftime("%Y-%m")))
  rescue ArgumentError, Date::Error => error
    render_error(message: error.message, status: :bad_request)
  end
end
