require "rails_helper"

RSpec.describe "実席のT/C自動採番", type: :request do
  include_context "authenticated request"
  let(:master) { create(:standard_master, system_key: "restaurant_master_type", name: "店内の区分") }
  let(:table_type) { create(:standard_list_master, standard_master: master, code: "T", label: "テーブル席") }
  let(:counter_type) { create(:standard_list_master, standard_master: master, code: "C", label: "カウンター席") }
  before do
    login_staff.staff_master.update!(role_code: "owner")
    login!
  end

  def register(type, extra = {})
    post "/api/v1/restaurant_masters", params: { restaurant_master: {
      restaurant_master_type_id: type.id, name: "個室1", capacity: 4, active: true
    }.merge(extra) }, headers: authenticated_headers, as: :json
  end

  it "表示名を変えてもAPIは読み取り専用のT/Cコードを返す" do
    table_type
    counter_type
    get "/api/v1/standard_masters"
    items = JSON.parse(response.body).dig("data", "standard_masters").first.fetch("items")
    expect(items.pluck("code")).to contain_exactly("T", "C")
  end

  [ nil, "X" ].each do |prefix|
    it "T/C以外の区分#{prefix.inspect}は項目エラーで拒否し、採番しない" do
      unsupported = create(:standard_list_master, standard_master: master, code: prefix)
      expect { register(unsupported) }.not_to change(RestaurantMaster, :count)
      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body).dig("errors", "restaurant_master_type_id")).to be_present
    end
  end

  it "無効化済みのT05を再利用せずT06を作り、CはC01から始める" do
    create(:restaurant_master, restaurant_master_type: table_type, code: "T05", sequence_number: 5,
      active: false, created_by_staff: login_staff, updated_by_staff: login_staff)
    register(table_type, code: "X99", sequence_number: 99)
    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body).dig("data", "restaurant_master")).to include("code" => "T06", "sequence_number" => 6)
    register(counter_type)
    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body).dig("data", "restaurant_master")).to include("code" => "C01", "sequence_number" => 1)
  end

  it "基本コードの更新APIから接頭辞を手入力で変えられない" do
    patch "/api/v1/standard_masters/#{master.id}/items/#{table_type.id}", params: {
      standard_list_master: { label: "大テーブル", code: "X" }
    }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(table_type.reload.code).to eq("T")
  end
end
