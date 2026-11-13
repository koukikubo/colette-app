require "rails_helper"

RSpec.describe "capacity_change_concurrency", type: :model do
  include_context "independent integrity connections"

  it "定員削減と予約作成が競合しても定員超過を作らない" do
    staff, type, attributes = booking_setup
    seat = tracked(:restaurant_master, restaurant_master_type: type, capacity: 4, created_by_staff: staff, updated_by_staff: staff)
    results = concurrently do |index|
      if index.zero?
        begin
          Reservations::CreateService.call(attributes: attributes.merge(restaurant_master_ids: [ seat.id ]), current_staff: staff)
          :success
        rescue ActiveRecord::RecordInvalid
          :rejected
        end
      else
        RestaurantMaster.find(seat.id).update(capacity: 2) ? :success : :rejected
      end
    end
    expect(results.sort).to eq([ :rejected, :success ])
    Reservation.where(reservation_name: @marker).each do |booking|
      expect(booking.restaurant_masters.sum(:capacity)).to be >= booking.guest_count
    end
  end
end
