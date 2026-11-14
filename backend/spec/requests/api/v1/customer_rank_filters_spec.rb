require "rails_helper"

RSpec.describe "顧客一覧の手動ランク絞り込み", type: :request do
  include_context "authenticated request"

  let(:master) { create(:standard_master, system_key: "customer_rank", name: "顧客ランク") }
  let(:rank) { create(:standard_list_master, standard_master: master, code: "A", label: "Aランク") }
  let!(:ranked) { create(:customer, customer_rank: rank, name: "検索対象", kana: "ケンサクタイショウ") }
  let!(:unassigned) { create(:customer) }

  before { login! }

  def data
    JSON.parse(response.body).fetch("data")
  end

  it "ランクで絞った件数とページを返す" do
    get "/api/v1/customers", params: { customer_rank_id: rank.id, per_page: 1 }
    expect(response).to have_http_status(:ok)
    expect(data.fetch("customers").pluck("id")).to eq([ ranked.id ])
    expect(data.dig("pagination", "total_count")).to eq(1)
  end

  it "未設定の顧客だけを返す" do
    get "/api/v1/customers", params: { customer_rank_id: "unassigned" }
    expect(response).to have_http_status(:ok)
    expect(data.fetch("customers").pluck("id")).to eq([ unassigned.id ])
  end

  it "検索語・区分・表示状態とANDで組み合わせる" do
    ranked.update!(hidden_at: Time.current)
    get "/api/v1/customers", params: { customer_rank_id: rank.id, query: "検索", customer_kind: "individual", visibility: "all" }
    expect(data.fetch("customers").pluck("id")).to eq([ ranked.id ])
    get "/api/v1/customers", params: { customer_rank_id: rank.id, visibility: "visible" }
    expect(data.fetch("customers")).to be_empty
  end

  it "無効になったランクでも過去に割り当てた顧客を検索できる" do
    rank.update!(active: false)
    get "/api/v1/customers", params: { customer_rank_id: rank.id }
    expect(response).to have_http_status(:ok)
    expect(data.fetch("customers").pluck("id")).to eq([ ranked.id ])
  end

  [ "abc", "0", "-1", "1.5", "99999999999999999999999" ].each do |value|
    it "不正なランクID #{value} は400を返す" do
      get "/api/v1/customers", params: { customer_rank_id: value }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to include("status" => "error")
    end
  end

  it "別カテゴリのIDは顧客ランクとして扱わない" do
    other_master = create(:standard_master, system_key: "rf_rank", name: "RFランク")
    other_rank = create(:standard_list_master, standard_master: other_master, code: "A", label: "RF A")
    get "/api/v1/customers", params: { customer_rank_id: other_rank.id }
    expect(response).to have_http_status(:bad_request)
  end
end
