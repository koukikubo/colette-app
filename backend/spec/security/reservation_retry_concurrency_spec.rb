require "rails_helper"

RSpec.describe "reservation_retry_concurrency", type: :model do
  include_context "independent integrity connections"

  it "同じキーの同時再送でも作成は1件だけ" do
    staff, _type, attributes = booking_setup
    key = SecureRandom.uuid
    ids = concurrently do |_index|
      Reservations::IdempotentCreator.call(attributes: attributes, current_staff: staff, key: key).id
    end
    expect(ids.uniq.size).to eq(1)
    expect(Reservation.where(reservation_name: @marker).count).to eq(1)
  end
end
