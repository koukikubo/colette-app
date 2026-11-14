class Api::V1::DashboardController < Api::V1::BaseController
  def show
    today = Time.zone.today
    reservations = Reservation.on_date(today)
    active = reservations.active
    pending = active.where(completed_at: nil)
    upcoming = pending.includes(:customer, :requested_restaurant_master_type, :reservation_status,
      :reservation_route, :menu_type, :occasion, :restaurant_masters,
      created_by_staff: :staff_master, updated_by_staff: :staff_master).order(:starts_at, :id).limit(10)
    current = RfSetting.first&.current_calculation_run
    monthly = RfCalculationRun.where(execution_source: "monthly").order(scheduled_month: :desc).first
    render_success(data: { date: today, as_of: Time.current,
      summary: { reservation_count: active.count, expected_guest_count: pending.sum(:guest_count),
        completed_count: active.where.not(completed_at: nil).count, canceled_count: reservations.canceled.count,
        unassigned_count: pending.where.not(id: ReservationTable.select(:reservation_id)).count,
        unconfirmed_count: pending.where(details_confirmed_at: nil).count },
      reservations: Api::V1::ReservationSerializer.collection(upcoming),
      rf: { base_date: current&.base_date, monthly_state: monthly&.monthly_apply_state, monthly_error: monthly&.monthly_apply_error } })
  end
end
