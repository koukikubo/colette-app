require "rails_helper"

RSpec.describe "restaurant_capacity_integrity", type: :request do
  include_context "authenticated request"
  let(:login_staff) { create(:staff, staff_master: create(:staff_master, role_code: "owner")) }
  before { login! }

  it "席の定員を既存予約未満にするAPI更新は422で拒否する" do
    type = create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type"))
    status = create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status"))
    seat = create(:restaurant_master, restaurant_master_type: type, capacity: 4, created_by_staff: login_staff, updated_by_staff: login_staff)
    start = Time.zone.today.next_day.beginning_of_day + 18.hours
    create(:reservation, requested_restaurant_master_type: type, reservation_status: status, guest_count: 4,
           starts_at: start, ends_at: start + 2.hours, restaurant_masters: [ seat ], created_by_staff: login_staff, updated_by_staff: login_staff)
    patch "/api/v1/restaurant_masters/#{seat.id}", params: { restaurant_master: { lock_version: seat.lock_version, capacity: 2 } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("errors", "capacity")).to be_present
    expect(seat.reload.capacity).to eq(4)
  end
end
