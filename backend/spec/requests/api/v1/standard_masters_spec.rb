require 'rails_helper'

RSpec.describe "Api::V1::StandardMasters", type: :request do
  def json
    JSON.parse(response.body)
  end

  def json_headers
    {
      "ACCEPT" => "application/json"
    }
  end

  # POST/PATCH前にCSRFトークンを取得する。
  # 同じrequest session内なので、CSRF取得時のCookieも維持される。
  def csrf_headers
    get "/api/v1/csrf", headers: json_headers

    token = JSON.parse(response.body).dig(
      "data",
      "csrf_token"
    )

    json_headers.merge(
      "X-CSRF-Token" => token
    )
  end

  describe "GET /api/v1/standard_masters" do
    let!(:second_standard_master) do
      create(
        :standard_master,
        name: "予約状態",
        position: 20
      )
    end

    let!(:first_standard_master) do
      create(
        :standard_master,
        name: "性別",
        position: 10
      )
    end

    before do
      create(
        :standard_list_master,
        standard_master: first_standard_master,
        label: "男性",
        position: 1
      )
    end
    it "基本コードをposition順で取得できる" do
      get "/api/v1/standard_masters",
          headers: json_headers

      expect(response).to have_http_status(:ok)

      standard_masters =
        json.dig("data", "standard_masters")

      expect(
        standard_masters.map { |record| record["id"] }
      ).to eq(
        [
          first_standard_master.id,
          second_standard_master.id
        ]
      )
    end

    it "基本コードマスタ一覧を取得できる" do
      get "/api/v1/standard_masters",
          headers: json_headers

      expect(response).to have_http_status(:ok)
      expect(json["status"]).to eq("success")      

      standard_masters =
        json.dig("data", "standard_masters")

      expect(standard_masters).to be_an(Array)
      expect(standard_masters.length).to eq(2)
    end

    it "紐づく選択肢コードをitemsとして返す" do
      get "/api/v1/standard_masters",
          headers: json_headers

      standard_masters =
        json.dig("data", "standard_masters")

      first_record = standard_masters.find do |record|
        record["id"] == first_standard_master.id
      end

      expect(first_record).to be_present
      expect(first_record["items"]).to be_an(Array)
      expect(first_record["items"].first["label"]).to eq("男性")
    end

    it "表示コードをIDの5桁ゼロ埋めで返す" do
      get "/api/v1/standard_masters",
          headers: json_headers

      standard_masters =
        json.dig("data", "standard_masters")

      first_record = standard_masters.find do |record|
        record["id"] == first_standard_master.id
      end

      expect(first_record["display_code"]).to eq(
        first_standard_master.id.to_s.rjust(5, "0")
      )
    end
  end

  

  describe "GET /api/v1/standard_masters/:id" do
    let(:standard_master) do
      create(
        :standard_master,
        name: "来店経路",
        description: "予約の流入経路",
        position: 30
      )
    end

    it "指定した基本コードを取得できる" do
      get "/api/v1/standard_masters/#{standard_master.id}",
          headers: json_headers

      expect(response).to have_http_status(:ok)

      record = json.dig("data", "standard_master")

      expect(record).to include(
        "id" => standard_master.id,
        "display_code" =>
          standard_master.id.to_s.rjust(5, "0"),
        "name" => "来店経路",
        "description" => "予約の流入経路",
        "active" => true
      )
    end

    it "存在しないIDの場合は404を返す" do
      get "/api/v1/standard_masters/999999",
          headers: json_headers

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/standard_masters" do
    before do
      create(
        :standard_master,
        name: "既存コード1",
        position: 2
      )

      create(
        :standard_master,
        name: "既存コード2",
        position: 5
      )
    end

    let(:valid_params) do
      {
        standard_master: {
          name: "予約区分",
          description: "予約の区分を管理する",
          active: true
        }
      }
    end

    it "基本コードを登録できる" do
      expect do
        post "/api/v1/standard_masters",
             params: valid_params,
             headers: csrf_headers,
             as: :json
      end.to change(StandardMaster, :count).by(1)

      expect(response).to have_http_status(:created)

      created_standard_master =
        StandardMaster.order(:id).last

      expect(created_standard_master).to have_attributes(
        name: "予約区分",
        description: "予約の区分を管理する",
        active: true,
        position: 6
      )
    end

    it "IDをDBで自動採番する" do
      post "/api/v1/standard_masters",
           params: valid_params,
           headers: csrf_headers,
           as: :json
           
      expect(response).to have_http_status(:created)
      created_standard_master =
        StandardMaster.order(:id).last
      expect(created_standard_master.id).to be_present
    end

    it "レスポンスに表示コードを返す" do
      post "/api/v1/standard_masters",
           params: valid_params,
           headers: csrf_headers,
           as: :json

      expect(response).to have_http_status(:created)

      created_standard_master =
        StandardMaster.order(:id).last

      record =
        json.dig("data", "standard_master")

      expect(record["display_code"]).to eq(
        created_standard_master.id.to_s.rjust(5, "0")
      )
    end

    it "名称が空の場合は422を返す" do
      invalid_params = {
        standard_master: {
          name: "",
          description: "名称なし",
          active: true
        }
      }

      expect do
        post "/api/v1/standard_masters",
             params: invalid_params,
             headers: csrf_headers,
             as: :json
      end.not_to change(StandardMaster, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /api/v1/standard_masters/:id" do
    let!(:standard_master) do
      create(
        :standard_master,
        name: "変更前",
        description: "変更前の説明",
        active: true,
        position: 10
      )
    end

    it "基本コードを更新できる" do
      patch "/api/v1/standard_masters/#{standard_master.id}",
            params: {
              standard_master: {
                name: "変更後",
                description: "変更後の説明",
                active: true
              }
            },
            headers: csrf_headers,
            as: :json

      expect(response).to have_http_status(:ok)

      expect(standard_master.reload).to have_attributes(
        name: "変更後",
        description: "変更後の説明",
        active: true,
        position: 10
      )
    end

    it "activeをfalseにして無効化できる" do
      patch "/api/v1/standard_masters/#{standard_master.id}",
            params: {
              standard_master: {
                name: standard_master.name,
                description: standard_master.description,
                active: false
              }
            },
            headers: csrf_headers,
            as: :json

      expect(response).to have_http_status(:ok)
      expect(standard_master.reload.active).to be(false)
    end

    it "名称が空の場合は422を返す" do
      patch "/api/v1/standard_masters/#{standard_master.id}",
            params: {
              standard_master: {
                name: "",
                description: standard_master.description,
                active: standard_master.active
              }
            },
            headers: csrf_headers,
            as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(standard_master.reload.name).to eq("変更前")
    end

    it "存在しないIDの場合は404を返す" do
      patch "/api/v1/standard_masters/999999",
            params: {
              standard_master: {
                name: "存在しない",
                description: nil,
                active: true
              }
            },
            headers: csrf_headers,
            as: :json

      expect(response).to have_http_status(:not_found)
    end
  end
end
