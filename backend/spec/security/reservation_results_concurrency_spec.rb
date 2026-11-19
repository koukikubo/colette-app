require "rails_helper"

RSpec.describe "退店結果の並行操作", type: :model do
  include_context "independent integrity connections"

  def setup_result_booking
    staff, _type, attributes = booking_setup
    StandardListMaster.find(attributes[:reservation_status_id]).update!(code: "confirmed")
    start = 1.day.ago.change(hour: 18)
    booking = Reservations::CreateService.call(attributes: attributes.merge(starts_at: start, ends_at: start + 2.hours), current_staff: staff)
    [ staff, booking ]
  end

  it "同じキーの同時退店でも記録は1件、版は1回だけ増える" do
    staff, booking = setup_result_booking
    key = SecureRandom.uuid
    versions = concurrently do
      Reservations::ResultChanger.call(reservation: Reservation.find(booking.id), attributes: { lock_version: 0 },
        current_staff: staff, key: key, operation: "complete").lock_version
    end
    expect(versions).to eq([ 1, 1 ])
    expect(ReservationResultChange.where(reservation: booking).count).to eq(1)
  end

  it "退店とキャンセルの同時操作は片方だけ成功し、他方は409相当になる" do
    staff, booking = setup_result_booking
    outcomes = concurrently do |index|
      Reservations::ResultChanger.call(reservation: Reservation.find(booking.id), attributes: { lock_version: 0 },
        current_staff: staff, key: SecureRandom.uuid, operation: index.zero? ? "complete" : "cancel")
      :success
    rescue ActiveRecord::StaleObjectError
      :conflict
    end
    expect(outcomes.sort).to eq([ :conflict, :success ])
    expect(ReservationResultChange.where(reservation: booking).count).to eq(1)
    expect(booking.reload.completed_at.present? && booking.canceled_at.present?).to be(false)
  end
end
