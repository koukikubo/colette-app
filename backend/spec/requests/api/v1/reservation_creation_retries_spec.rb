require "rails_helper"

RSpec.describe "予約作成の再送", type: :request do
  include_context "authenticated request"

  let(:seat_type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let(:status) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "reservation_status")) }
  let(:key) { SecureRandom.uuid }
  let(:attributes) do
    start = Time.zone.today.next_day.beginning_of_day + 18.hours
    { reservation_name: "再送検証", reservation_phone_number: "09011112222", guest_count: 2,
      starts_at: start.iso8601, ends_at: (start + 2.hours).iso8601,
      requested_restaurant_master_type_id: seat_type.id, reservation_status_id: status.id,
      restaurant_master_ids: [] }
  end
  before { login! }

  def submit(values = attributes, token = key)
    post "/api/v1/reservations", params: { reservation: values },
         headers: authenticated_headers.merge("Idempotency-Key" => token), as: :json
  end

  it "同じ操作を再送しても同じ予約を返し1件だけ保存する" do
    submit
    expect(response).to have_http_status(:created)
    id = response.parsed_body.dig("data", "reservation", "id")
    expect { submit }.not_to change(Reservation, :count)
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.dig("data", "reservation", "id")).to eq(id)
  end

  it "同じキーを別の入力に使った場合は409で拒否する" do
    submit
    expect { submit(attributes.merge(guest_count: 3)) }.not_to change(Reservation, :count)
    expect(response).to have_http_status(:conflict)
  end

  it "同じ内容でも別の作成操作なら登録できる" do
    submit
    expect { submit(attributes, SecureRandom.uuid) }.to change(Reservation, :count).by(1)
    expect(response).to have_http_status(:created)
  end

  it "キー未指定・不正なキーでは予約を作らない" do
    [ nil, "", "x" * 129 ].each do |token|
      expect { submit(attributes, token) }.not_to change(Reservation, :count)
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "入力エラーを直した後は同じキーで作成できる" do
    submit(attributes.merge(guest_count: 0))
    expect(response).to have_http_status(:unprocessable_content)
    expect { submit }.to change(Reservation, :count).by(1)
    expect(response).to have_http_status(:created)
  end
end
