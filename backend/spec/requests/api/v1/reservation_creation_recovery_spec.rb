require "rails_helper"
RSpec.describe "予約登録結果の確認", type: :request do
  include_context "authenticated request"
  let(:key) { "reservation-recovery-key-1234" }
  before { login! }
  def booking
    type = create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type"))
    status = create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status"))
    create(:reservation, requested_restaurant_master_type: type, reservation_status: status)
  end
  it "担当者に紐づくキーで確定した予約だけを返す" do
    reservation = booking
    ReservationCreationRequest.create!(staff: login_staff, reservation: reservation, key_digest: CreationRequestKey.digest(key), request_digest: "a" * 64)
    get "/api/v1/reservations/creation_result", headers: { "Idempotency-Key" => key }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "reservation", "id")).to eq(reservation.id)
  end
  it "他担当者の結果は存在していても返さない" do
    ReservationCreationRequest.create!(staff: create(:staff), reservation: booking, key_digest: CreationRequestKey.digest(key), request_digest: "a" * 64)
    get "/api/v1/reservations/creation_result", headers: { "Idempotency-Key" => key }
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body["code"]).to eq("creation_not_found")
  end
end
