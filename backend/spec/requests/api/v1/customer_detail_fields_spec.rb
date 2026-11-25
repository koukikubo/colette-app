require "rails_helper"

RSpec.describe "顧客の店舗独自項目", type: :request do
  include_context "authenticated request"
  let(:customer) { create(:customer) }
  let(:field) { create(:standard_master, system_key: nil, name: "タバコ", customer_detail_mode: "single") }
  let(:choice) { create(:standard_list_master, standard_master: field) }

  def save_fields(answers, version: customer.reload.lock_version)
    patch "/api/v1/customers/#{customer.id}/detail_fields", params: {
      customer_details: { lock_version: version, answers: answers }
    }, headers: authenticated_headers, as: :json
  end

  it "未認証は401、viewerは参照のみ、operatorは保存できる" do
    get "/api/v1/customers/#{customer.id}/detail_fields"
    expect(response).to have_http_status(:unauthorized)
    login!
    login_staff.staff_master.update!(role_code: "viewer")
    login!
    get "/api/v1/customers/#{customer.id}/detail_fields"
    expect(response).to have_http_status(:ok)
    save_fields([ { field_id: field.id, option_ids: [ choice.id ] } ])
    expect(response).to have_http_status(:forbidden)
    login_staff.staff_master.update!(role_code: "operator")
    login!
    save_fields([ { field_id: field.id, option_ids: [ choice.id ] } ])
    expect(response).to have_http_status(:ok), response.body
  end

  it "親コードの選択肢を保存し、他の顧客へ漏らさない" do
    login!
    save_fields([ { field_id: field.id, option_ids: [ choice.id ] } ])
    expect(response).to have_http_status(:ok), response.body
    data = response.parsed_body.fetch("data")
    expect(data.fetch("fields").first).to include("selected_ids" => [ choice.id ], "mode" => "single")
    expect(customer.reload.updated_by_staff).to eq(login_staff)
    other = create(:customer)
    get "/api/v1/customers/#{other.id}/detail_fields"
    expect(response.parsed_body.dig("data", "fields").first.fetch("selected_ids")).to eq([])
  end

  it "別項目の選択肢・単一への複数回答・重複・不正IDを部分保存せず拒否する" do
    login!
    another = create(:standard_list_master, standard_master: field)
    foreign = create(:standard_list_master)
    [ [ choice.id, another.id ], [ foreign.id ], [ choice.id, choice.id ] ].each do |ids|
      save_fields([ { field_id: field.id, option_ids: ids } ])
      expect(response).to have_http_status(:unprocessable_content), response.body
      expect(CustomerDetailSelection.count).to eq(0)
    end
    save_fields([ { field_id: field.id, option_ids: [ "bad" ] } ])
    expect(response).to have_http_status(:bad_request)
  end

  it "古い版は409で拒否し、再送しても二重登録しない" do
    login!
    version = customer.lock_version
    answer = [ { field_id: field.id, option_ids: [ choice.id ] } ]
    save_fields(answer, version: version)
    expect(response).to have_http_status(:ok)
    save_fields(answer, version: version)
    expect(response).to have_http_status(:conflict)
    expect(CustomerDetailSelection.count).to eq(1)
  end

  it "無効な新規選択は拒否し、既存回答は表示・保持できる" do
    login!
    save_fields([ { field_id: field.id, option_ids: [ choice.id ] } ])
    choice.update!(active: false)
    save_fields([ { field_id: field.id, option_ids: [ choice.id ] } ])
    expect(response).to have_http_status(:ok)
    field.update!(customer_detail_mode: "none")
    get "/api/v1/customers/#{customer.id}/detail_fields"
    expect(response.parsed_body.dig("data", "fields").first).to include("enabled" => false, "selected_ids" => [ choice.id ])
    save_fields([ { field_id: field.id, option_ids: [] } ])
    expect(response).to have_http_status(:unprocessable_content)
    expect(CustomerDetailSelection.count).to eq(1)
  end

  it "複数回答の単一化と業務コードの転用を拒否する" do
    login!
    field.update!(customer_detail_mode: "multiple")
    second = create(:standard_list_master, standard_master: field)
    save_fields([ { field_id: field.id, option_ids: [ choice.id, second.id ] } ])
    expect(response).to have_http_status(:ok)
    expect(field.update(customer_detail_mode: "single")).to be(false)
    reserved = create(:standard_master, system_key: "reservation_status")
    expect(reserved.update(customer_detail_mode: "single")).to be(false)
  end
  it "1000件を超えて顧客項目を設定・一括読取できる" do
    login!
    login_staff.staff_master.update!(role_code: "owner")
    login!
    first_position = StandardMaster.maximum(:position).to_i + 1
    records = 1001.times.map { |index| { name: "項目#{index}", position: first_position + index,
      active: true, usage_place_id: StandardCodeUsagePlace.find_by!(key: "customer_details").id, input_type: "single", created_at: Time.current, updated_at: Time.current } }
    StandardMaster.insert_all!(records)
    get "/api/v1/customers/#{customer.id}/detail_fields"
    expect(response).to have_http_status(:ok)
    fields = response.parsed_body.dig("data", "fields")
    expect(fields.size).to eq(1001)
    save_fields(fields.map { |item| { field_id: item.fetch("id"), option_ids: [] } })
    expect(response).to have_http_status(:ok), response.body
    post "/api/v1/standard_masters", params: { standard_master: { name: "追加項目", customer_detail_mode: "single" } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:created)
  end
end
