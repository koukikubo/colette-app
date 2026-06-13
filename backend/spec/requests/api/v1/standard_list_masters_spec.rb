require 'rails_helper'

RSpec.describe "Api::V1::StandardListMasters", type: :request do
  def json
    JSON.parse(response.body)
  end

  def json_headers
    {
      "ACCEPT" => "application/json"
    }
  end

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

  describe "GET /api/v1/standard_masters/:standard_master_id/items" do
    let(:standard_master) do
      create(:standard_master, name: "性別")
    end

    let(:other_standard_master) do
      create(:standard_master, name: "予約状態")
    end

    let!(:second_item) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        label: "女性",
        position: 20
      )
    end

    let!(:first_item) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        label: "男性",
        position: 10
      )
    end

    before do
      create(
        :standard_list_master,
        standard_master: other_standard_master,
        label: "予約確定",
        position: 1
      )
    end
    
    it "基本コードマスタのアイテム一覧を取得できる" do
      get "/api/v1/standard_masters/#{standard_master.id}/items",
        headers: json_headers

      expect(response).to have_http_status(:ok)
      expect(json["status"]).to eq("success")

      records =
          json.dig("data", "standard_list_masters")

      expect(records).to be_an(Array)
        expect(records.size).to eq(2)

        expect(
          records.map { |record| record["label"] }
        ).to eq(
          [
            "男性",
            "女性"
          ]
        )    
    end

    it "指定した基本コードの選択肢だけを取得できる" do
      get "/api/v1/standard_masters/#{standard_master.id}/items",
          headers: json_headers

      expect(response).to have_http_status(:ok)

      records =
        json.dig("data", "standard_list_masters")

      expect(
        records.map { |record| record["id"] }
      ).to eq(
        [
          first_item.id,
          second_item.id
        ]
      )
    end
    
    it "選択肢コードをposition順で返す" do
      get "/api/v1/standard_masters/#{standard_master.id}/items",
          headers: json_headers

      records =
        json.dig("data", "standard_list_masters")

      expect(
        records.map { |record| record["label"] }
      ).to eq(
        [
          "男性",
          "女性"
        ]
      )
    end

    it "存在しない基本コードマスタの場合は404を返す" do
      get "/api/v1/standard_masters/non_existent/items"

      expect(response).to have_http_status(:not_found)

      json = JSON.parse(response.body)

      expect(json["status"]).to eq("error")
      expect(json["message"]).to eq("データが見つかりませんでした")
    end
  end

  describe "GET /api/v1/standard_masters/:standard_master_id/items/:id" do
    let(:standard_master) do
      create(:standard_master)
    end

    let(:other_standard_master) do
      create(:standard_master)
    end

    let(:standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        label: "男性"
      )
    end

    let(:other_item) do
      create(
        :standard_list_master,
        standard_master: other_standard_master,
        label: "予約確定"
      )
    end

    it "指定した選択肢コードを取得できる" do
      get(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{standard_list_master.id}",
        headers: json_headers
      )

      expect(response).to have_http_status(:ok)

      record =
        json.dig("data", "standard_list_master")

      expect(record).to include(
        "id" => standard_list_master.id,
        "display_code" =>
          standard_list_master.id.to_s.rjust(5, "0"),
        "label" => "男性",
        "active" => true
      )
    end

    it "別の基本コードに属する選択肢は取得できない" do
      get(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{other_item.id}",
        headers: json_headers
      )

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/standard_masters/:standard_master_id/items" do
    let(:standard_master) do
      create(:standard_master, name: "性別")
    end

    before do
      create(
        :standard_list_master,
        standard_master: standard_master,
        position: 2
      )

      create(
        :standard_list_master,
        standard_master: standard_master,
        position: 5
      )
    end

    let(:valid_params) do
      {
        standard_list_master: {
          label: "回答しない",
          description: "回答を希望しない場合",
          active: true
        }
      }
    end

    it "選択肢コードを登録できる" do
      expect do
        post(
          "/api/v1/standard_masters/" \
          "#{standard_master.id}/items",
          params: valid_params,
          headers: csrf_headers,
          as: :json
        )
      end.to change(StandardListMaster, :count).by(1)

      expect(response).to have_http_status(:created)

      created_item =
        standard_master
          .standard_list_masters
          .order(:id)
          .last

      expect(created_item).to have_attributes(
        standard_master_id: standard_master.id,
        label: "回答しない",
        description: "回答を希望しない場合",
        active: true,
        position: 6
      )
    end

    it "レスポンスに表示コードを返す" do
      post(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items",
        params: valid_params,
        headers: csrf_headers,
        as: :json
      )

      created_item =
        standard_master
          .standard_list_masters
          .order(:id)
          .last

      record =
        json.dig("data", "standard_list_master")

      expect(record["display_code"]).to eq(
        created_item.id.to_s.rjust(5, "0")
      )
    end

    it "表示名が空の場合は422を返す" do
      invalid_params = {
        standard_list_master: {
          label: "",
          description: "表示名なし",
          active: true
        }
      }

      expect do
        post(
          "/api/v1/standard_masters/" \
          "#{standard_master.id}/items",
          params: invalid_params,
          headers: csrf_headers,
          as: :json
        )
      end.not_to change(StandardListMaster, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "存在しない基本コードの場合は404を返す" do
      post "/api/v1/standard_masters/999999/items",
           params: valid_params,
           headers: csrf_headers,
           as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/standard_masters/:standard_master_id/items/:id" do
    let(:standard_master) do
      create(:standard_master, name: "性別")
    end

    let(:other_standard_master) do
      create(:standard_master, name: "予約状態")
    end

    let!(:standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        label: "男性",
        description: "変更前",
        active: true,
        position: 10
      )
    end

    let!(:other_item) do
      create(
        :standard_list_master,
        standard_master: other_standard_master,
        label: "予約確定"
      )
    end

    it "選択肢コードを更新できる" do
      patch(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{standard_list_master.id}",
        params: {
          standard_list_master: {
            label: "男性（更新）",
            description: "変更後",
            active: true
          }
        },
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      expect(standard_list_master.reload).to have_attributes(
        label: "男性（更新）",
        description: "変更後",
        active: true,
        position: 10,
        standard_master_id: standard_master.id
      )
    end

    it "activeをfalseにして無効化できる" do
      patch(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{standard_list_master.id}",
        params: {
          standard_list_master: {
            label: standard_list_master.label,
            description: standard_list_master.description,
            active: false
          }
        },
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(standard_list_master.reload.active).to be(false)
    end

    it "表示名が空の場合は422を返す" do
      patch(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{standard_list_master.id}",
        params: {
          standard_list_master: {
            label: "",
            description: standard_list_master.description,
            active: standard_list_master.active
          }
        },
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(standard_list_master.reload.label).to eq("男性")
    end

    it "別の基本コードに属する選択肢は更新できない" do
      patch(
        "/api/v1/standard_masters/" \
        "#{standard_master.id}/items/" \
        "#{other_item.id}",
        params: {
          standard_list_master: {
            label: "不正更新",
            description: nil,
            active: false
          }
        },
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:not_found)
      expect(other_item.reload.label).to eq("予約確定")
    end
  end
end
