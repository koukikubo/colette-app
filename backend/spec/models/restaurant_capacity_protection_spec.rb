require "rails_helper"

RSpec.describe "割当済み席の定員保護", type: :model do
  let(:staff) { create(:staff) }
  let(:type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }
  let(:seat) { create(:restaurant_master, restaurant_master_type: type, capacity: 4, created_by_staff: staff, updated_by_staff: staff) }
  def book(**extra)
    start = Time.zone.today.next_day.beginning_of_day + 18.hours
    create(:reservation, requested_restaurant_master_type: type, reservation_status: status,
           starts_at: start, ends_at: start + 2.hours, guest_count: 4,
           created_by_staff: staff, updated_by_staff: staff, restaurant_masters: [ seat ], **extra)
  end

  it "未来の予約を定員超過にする削減を拒否する" do
    booking = book
    expect(seat.update(capacity: 2)).to be(false)
    expect(seat.errors.full_messages.join).to include(booking.id.to_s)
    expect(seat.reload.capacity).to eq(4)
  end

  it "複数席の合計が足りれば削減できる" do
    booking = book
    other = create(:restaurant_master, restaurant_master_type: type, capacity: 2, created_by_staff: staff, updated_by_staff: staff)
    booking.restaurant_masters << other
    expect(seat.update(capacity: 2)).to be(true)
  end

  it "キャンセル・完了・過去の予約は将来の定員変更を止めない" do
    book(canceled_at: Time.current)
    book(completed_at: Time.current)
    start = Time.zone.yesterday.beginning_of_day + 18.hours
    book(starts_at: start, ends_at: start + 2.hours)
    expect(seat.update(capacity: 2)).to be(true)
  end
end
