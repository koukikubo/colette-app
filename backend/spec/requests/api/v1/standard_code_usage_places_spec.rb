require "rails_helper"

RSpec.describe "基本コードの使用場所", type: :request do
  include_context "authenticated request"
  let(:customer_place) { StandardCodeUsagePlace.find_by!(key: "customer_details") }
  let(:reservation_place) { StandardCodeUsagePlace.find_by!(key: "reservation_details") }
  let(:customer) { create(:customer) }

  before do
    login!
    login_staff.staff_master.update!(role_code: "owner")
    login!
  end

  def update_master(master, attributes)
    patch "/api/v1/standard_masters/#{master.id}", params: { standard_master: attributes }, headers: authenticated_headers, as: :json
  end

  it "使用場所をAPIで列挙し、用途と入力方法を独立して設定できる" do
    get "/api/v1/standard_masters"
    expect(response.parsed_body.dig("data", "usage_places").map { |place| place.fetch("key") }).to eq(%w[customer_details reservation_details])
    post "/api/v1/standard_masters", params: { standard_master: { name: "嗜好品", usage_place_id: customer_place.id, input_type: "multiple", input_group: "嗜好" } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:created), response.body
    expect(response.parsed_body.dig("data", "standard_master")).to include("usage_place_id" => customer_place.id, "input_type" => "multiple", "customer_detail_mode" => "multiple")
    master = StandardMaster.find(response.parsed_body.dig("data", "standard_master", "id"))
    update_master(master, usage_place_id: reservation_place.id)
    expect(response).to have_http_status(:ok), response.body
    expect(master.reload).to have_attributes(input_type: "multiple", customer_detail_mode: "none")
  end

  it "用途変更・解除でも顧客回答を失わず、別用途の新規項目は顧客に出さない" do
    master = create(:standard_master, system_key: nil, usage_place: customer_place, input_type: "multiple")
    choice = create(:standard_list_master, standard_master: master)
    CustomerDetailSelection.create!(customer: customer, standard_list_master: choice)
    hidden = create(:standard_master, system_key: nil, usage_place: reservation_place)
    [ reservation_place.id, nil ].each do |place_id|
      update_master(master, usage_place_id: place_id)
      expect(response).to have_http_status(:ok), response.body
      get "/api/v1/customers/#{customer.id}/detail_fields"
      fields = response.parsed_body.dig("data", "fields")
      expect(fields.find { |field| field.fetch("id") == master.id }).to include("enabled" => false, "selected_ids" => [ choice.id ])
      expect(fields.map { |field| field.fetch("id") }).not_to include(hidden.id)
      expect(CustomerDetailSelection.where(customer: customer).count).to eq(1)
    end
    update_master(master, usage_place_id: customer_place.id)
    expect(response).to have_http_status(:ok)
    get "/api/v1/customers/#{customer.id}/detail_fields"
    expect(response.parsed_body.dig("data", "fields").first).to include("enabled" => true, "mode" => "multiple", "selected_ids" => [ choice.id ])
  end

  it "業務用コードの転用、不明な用途、入力方法、新旧契約の混在を拒否する" do
    reserved = create(:standard_master)
    update_master(reserved, usage_place_id: customer_place.id)
    expect(response).to have_http_status(:unprocessable_content)
    master = create(:standard_master, system_key: nil)
    [ { usage_place_id: 0 }, { input_type: "other" } ].each do |attributes|
      update_master(master, attributes)
      expect(response).to have_http_status(:unprocessable_content), response.body
    end
    update_master(master, usage_place_id: customer_place.id, customer_detail_mode: "none")
    expect(response).to have_http_status(:bad_request)
    expect(master.reload.usage_place_id).to be_nil
  end

  it "全体件数の上限でも既存コードの編集を許可し、新規追加だけを拒否する" do
    master = create(:standard_master, system_key: nil)
    stub_const("StandardMaster::MAX_RECORDS", StandardMaster.count)
    update_master(master, usage_place_id: customer_place.id)
    expect(response).to have_http_status(:ok), response.body
    post "/api/v1/standard_masters", params: { standard_master: { name: "上限超過" } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end
end
