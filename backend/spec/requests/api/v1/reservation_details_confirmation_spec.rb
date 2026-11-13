require "rails_helper"
RSpec.describe "予約詳細の確認", type: :request do
  include_context "authenticated request"
  it "確認した予約の版とサーバー時刻で確認済みにし、古い版は拒否する" do
    login!
    type = create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type"))
    status = create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status"))
    record = create(:reservation, requested_restaurant_master_type: type, reservation_status: status, created_by_staff: login_staff, updated_by_staff: login_staff)
    patch "/api/v1/reservations/#{record.id}/confirm_details", params: { reservation: { lock_version: record.lock_version } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload.details_confirmed_at).to be_within(3.seconds).of(Time.current)
    patch "/api/v1/reservations/#{record.id}/confirm_details", params: { reservation: { lock_version: 0 } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:conflict)
    patch "/api/v1/reservations/#{record.id}", params: { reservation: { lock_version: record.lock_version, guest_count: 3 } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(record.reload.details_confirmed_at).to be_nil
  end
end
