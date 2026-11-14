require "rails_helper"

RSpec.describe "追加基本コードのnullable契約", type: :request do
  include_context "authenticated request"

  before { login! }

  def additional_code(system_key)
    master = create(:standard_master, system_key: system_key)
    # 利用者が追加する項目は、DB idと表示名を持ち、業務用codeは未設定を許す。
    create(:standard_list_master, standard_master: master, code: nil, label: "追加の選択肢")
  end

  it "予約が参照する基本コードのcodeはnullも返る" do
    reservation = create(:reservation,
      requested_restaurant_master_type: additional_code("restaurant_master_type"),
      reservation_status: additional_code("reservation_status"),
      created_by_staff: login_staff, updated_by_staff: login_staff)
    get "/api/v1/reservations/#{reservation.id}"
    expect(response).to have_http_status(:ok)
    value = JSON.parse(response.body).dig("data", "reservation")
    expect(value.fetch("requested_restaurant_master_type").fetch("code")).to be_nil
    expect(value.fetch("reservation_status").fetch("code")).to be_nil
  end

  it "実席のcodeと、席種の任意の業務codeを混同しない" do
    seat = create(:restaurant_master,
      restaurant_master_type: additional_code("restaurant_master_type"),
      created_by_staff: login_staff, updated_by_staff: login_staff)
    get "/api/v1/restaurant_masters/#{seat.id}"
    expect(response).to have_http_status(:ok)
    value = JSON.parse(response.body).dig("data", "restaurant_master")
    expect(value.fetch("code")).to eq(seat.code)
    expect(value.fetch("restaurant_master_type").fetch("code")).to be_nil
  end
end
